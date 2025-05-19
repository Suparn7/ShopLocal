import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "shoplocal-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Email/Password strategy
  passport.use('local', 
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Phone authentication strategy (simplified for demo)
  passport.use('phone',
    new LocalStrategy({
      usernameField: 'phone',
      passwordField: 'otp'
    }, async (phone, otp, done) => {
      try {
        // In a real app, we would verify the OTP here
        // For demo purposes, we'll accept any OTP and find user by phone
        const user = await storage.getUserByPhone(phone);
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register with email route
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { name, email, password, role, phone } = req.body;
      
      // Validate role
      if (role && ![UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user already exists
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser) {
          return res.status(400).json({ message: "Phone number already registered" });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || UserRole.CUSTOMER,
        language: "en",
      });

      // If user is a customer, create customer profile
      if (user.role === UserRole.CUSTOMER) {
        await storage.createCustomerProfile({
          userId: user.id,
        });
      }

      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone,
          role: user.role,
          language: user.language,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login with email route
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({ 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone,
          role: user.role,
          language: user.language,
        });
      });
    })(req, res, next);
  });

  // Login/register with phone OTP route (simplified for demo)
  app.post("/api/auth/phone", async (req, res, next) => {
    try {
      const { phone, name, role } = req.body;
      
      // Find or create user
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        // Create new user with phone authentication
        user = await storage.createUser({
          name: name || `User-${phone.substring(phone.length - 4)}`,
          phone,
          password: await hashPassword(randomBytes(8).toString('hex')), // Random password for OTP users
          role: role || UserRole.CUSTOMER,
          language: "en",
        });

        // If user is a customer, create customer profile
        if (user.role === UserRole.CUSTOMER) {
          await storage.createCustomerProfile({
            userId: user.id,
          });
        }
      }
      
      // In real app, we would generate and send OTP here
      
      // For demo, return success message
      return res.status(200).json({ 
        message: "OTP sent successfully",
        phone
      });
    } catch (error) {
      next(error);
    }
  });

  // Verify phone OTP route (simplified for demo)
  app.post("/api/auth/verify-otp", (req, res, next) => {
    passport.authenticate('phone', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Invalid OTP" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({ 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone,
          role: user.role,
          language: user.language,
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    return res.status(200).json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      phone: user.phone,
      role: user.role,
      language: user.language,
    });
  });

  // Update user language
  app.post("/api/auth/language", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { language } = req.body;
      if (!language || !['en', 'hi'].includes(language)) {
        return res.status(400).json({ message: "Invalid language" });
      }
      
      const user = req.user;
      const updatedUser = await storage.updateUser(user.id, { language });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone,
        role: updatedUser.role,
        language: updatedUser.language,
      });
    } catch (error) {
      next(error);
    }
  });
}
