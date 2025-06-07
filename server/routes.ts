import type { Express } from "express";
import { createServer, type Server as HTTPServer } from "http"; // Rename 'Server' to 'HTTPServer'
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertCategorySchema, insertShopSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, insertReviewSchema, UserRole } from "@shared/schema";
import Stripe from "stripe";
import * as dotenv from 'dotenv'
import Razorpay from "razorpay";
import crypto from "crypto";
import multer from "multer";
dotenv.config();
import * as XLSX from "xlsx";
import fs from "fs";
import { Server as SocketIOServer } from "socket.io"; // Rename 'Server' to 'SocketIOServer'
let io: SocketIOServer;

export function setWebSocketInstance(socketServer: SocketIOServer) {
  io = socketServer;
}


export async function registerRoutes(app: Express): Promise<HTTPServer> {
  // Setup authentication routes
  setupAuth(app);
  const upload = multer({ dest: "uploads/" });

  const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-04-30.basil",
  });

  const razorpay = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_KEY_ID,
    key_secret: process.env.VITE_RAZORPAY_KEY_SECRET,
  });
  
  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };
  
  // Middleware to check if user has specific role
  const checkRole = (role: string) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== role && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };

  // Categories Routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.post("/api/categories", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid category data", errors: validation.error.errors });
      }
      
      const category = await storage.createCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.put("/api/categories/:id", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  app.delete("/api/categories/:id", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Shops Routes
  app.get("/api/shops", async (req, res) => {
    try {
      let shops;
      console.log("Incoming request for SHOPPPPPP:", req.query);
      
      
      // If latitude, longitude, and radius are provided, get nearby shops
      if (req.query.lat && req.query.lng && req.query.radius) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = parseFloat(req.query.radius as string) || 5;
        
        if (isNaN(lat) || isNaN(lng)) {
          return res.status(400).json({ message: "Invalid coordinates" });
        }
        
        shops = await storage.getNearbyShops(lat, lng, radius);
      } 
      // If category ID is provided, get shops by category
      else if (req.query.categoryId) {
        const categoryId = parseInt(req.query.categoryId as string);
        if (isNaN(categoryId)) {
          return res.status(400).json({ message: "Invalid category ID" });
        }
        
        shops = await storage.getShopsByCategory(categoryId);
      }
      // Otherwise, get all approved shops
      else {
        console.log("Fetching all approved shops");
        
        shops = (await storage.getAllShops());
      }
      
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });
  
  app.get("/api/shops/:id", async (req, res) => {
    try {
      console.log("Incoming request for shopbyID:", req.params.id);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      const shop = await storage.getShopById(id);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Check if shop is approved or if current user is the vendor or admin
      if (!shop.isApproved && 
         (!req.isAuthenticated() || 
          (req.user.id !== shop.vendorId && req.user.role !== UserRole.ADMIN))) {
        return res.status(403).json({ message: "Shop not available" });
      }
      
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });
  
  app.post("/api/shops", ensureAuthenticated, checkRole(UserRole.VENDOR), async (req, res) => {
    try {
     // console.log("Incoming shop data:", req);
  
      const validation = insertShopSchema.safeParse({
        ...req.body,
        vendorId: req.user.id,
      });
  
      if (!validation.success) {
        console.error("Validation errors:", validation.error.errors);
        return res.status(400).json({ message: "Invalid shop data", errors: validation.error.errors });
      }
  
      const shop = await storage.createShop(validation.data);
      io.to("customer").emit("shop-added", shop);
      res.status(201).json(shop);
    } catch (error) {
      console.error("Error creating shop:", error);
      res.status(500).json({ message: "Failed to create shop" });
    }
  });
  
  app.put("/api/shops/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      // Get existing shop
      const existingShop = await storage.getShopById(id);
      if (!existingShop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Check if user is the vendor or admin
      if (req.user.id !== existingShop.vendorId && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const data = { ...req.body };
      
      // Admin-only fields
      if (req.user.role !== UserRole.ADMIN) {
        delete data.isApproved;
        delete data.isGstVerified;
      }
      
      const shop = await storage.updateShop(id, data);
      io.to("customer").emit("shop-updated", shop);
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  // Delete Shop
  app.delete("/api/shops/:id", ensureAuthenticated, async (req, res) => {
    const shopId = req.params.id;
    await storage.deleteShop(shopId);

    // Emit event to all customers
    io.to("customer").emit("shop-deleted", { shopId });

    res.status(204).end();
  });
  
  // Get vendor shops
  app.get("/api/vendor/shops", ensureAuthenticated, checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      const shops = await storage.getShopsByVendorId(req.user.id);
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendor shops" });
    }
  });
  
  // Admin - get all shops including unapproved ones
  app.get("/api/admin/shops", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const shops = await storage.getAllShops();
      console.log("Admin fetching all shops:", shops);
      
      res.json(shops);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });
  
  // Admin - approve shop
  app.post("/api/admin/shops/:id/approve", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      const shop = await storage.updateShop(id, { isApproved: true });
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      res.json(shop);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve shop" });
    }
  });

  // Admin - get all customers
app.get("/api/admin/customers", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
  try {
    const customers = await storage.getUsersByRole(UserRole.CUSTOMER);
    console.log("Admin fetching all customers:", customers);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

// Admin - get orders for a specific customer
app.get("/api/admin/customers/:id/orders", ensureAuthenticated, checkRole(UserRole.ADMIN), async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const orders = await storage.getOrdersByCustomerId(customerId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customer orders" });
  }
});

  // Products Routes
  app.get("/api/shops/:shopId/products", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      const products = await storage.getProductsByShopId(shopId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  //add product
  app.post("/api/shops/:shopId/products", ensureAuthenticated, async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      // Verify shop exists and user is the vendor
      const shop = await storage.getShopById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      if (shop.vendorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate product data
      const validation = insertProductSchema.safeParse({
        ...req.body,
        shopId
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid product data", errors: validation.error.errors });
      }
      
      const product = await storage.createProduct(validation.data);

      // Emit event to the shop-specific room
      io.to(`shop-${shopId}`).emit("product-added", product);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.put("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Verify product exists
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Verify shop exists and user is the vendor
      const shop = await storage.getShopById(product.shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      if (shop.vendorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update product
      const updatedProduct = await storage.updateProduct(id, req.body);
       // Emit event to the shop-specific room
      io.to(`shop-${product.shopId}`).emit("product-updated", updatedProduct);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  app.delete("/api/products/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Verify product exists
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Verify shop exists and user is the vendor
      const shop = await storage.getShopById(product.shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      if (shop.vendorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete product
      const deleted = await storage.deleteProduct(id);
      if (deleted) {
        // Emit event to the shop-specific room
        io.to(`shop-${product.shopId}`).emit("product-deleted", { productId: id });
      }
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Orders Routes
  app.get("/api/customer/orders", ensureAuthenticated, checkRole(UserRole.CUSTOMER), async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomerId(req.user.id);
      
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await storage.getOrderItemsByOrderId(order.id);
        return { ...order, items };
      }));
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/vendor/orders", ensureAuthenticated, checkRole(UserRole.VENDOR), async (req, res) => {
    try {
      // Get vendor's shops
      const shops = await storage.getShopsByVendorId(req.user.id);
      
      // Get orders for all shops
      let allOrders = [];
      for (const shop of shops) {
        const shopOrders = await storage.getOrdersByShopId(shop.id);
        
        // Fetch order items for each order
        const ordersWithItems = await Promise.all(shopOrders.map(async (order) => {
          const items = await storage.getOrderItemsByOrderId(order.id);
          return { ...order, items };
        }));
        
        allOrders = [...allOrders, ...ordersWithItems];
      }
      
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  app.post("/api/orders", ensureAuthenticated, checkRole(UserRole.CUSTOMER), async (req, res) => {
    try {
      const validation = insertOrderSchema.safeParse({
        ...req.body,
        customerId: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid order data", errors: validation.error.errors });
      }
      
      // Verify shop exists
      const shop = await storage.getShopById(validation.data.shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Create order
      const order = await storage.createOrder(validation.data);
      
      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const itemValidation = insertOrderItemSchema.safeParse({
            ...item,
            orderId: order.id
          });
          
          if (itemValidation.success) {
            await storage.createOrderItem(itemValidation.data);
          }
        }
      }
      
      // Fetch order with items
      const items = await storage.getOrderItemsByOrderId(order.id);

      // Emit real-time event to the vendor
      io.to(`vendor-${shop.vendorId}`).emit("new-order", {
        id: order.id,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        status: order.status,
        items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus, // Include paymentStatus here
        customer: {
          id: req.user.id,
          name: req.user.name,
        },
      });
      
      res.status(201).json({ ...order, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  app.put("/api/orders/:id/status", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status, customerId } = req.body;
      console.log("Incoming request to update order status:", req.body);
      
      if (!status || !customerId) {
        return res.status(400).json({ message: "Status and customerId are required" });
      }
      
      // Verify order exists
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify user is the vendor of the shop
      const shop = await storage.getShopById(order.shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Customer can only cancel pending orders
      if (req.user.role === UserRole.CUSTOMER) {
        if (order.customerId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (status !== 'cancelled' || order.status !== 'pending') {
          return res.status(403).json({ message: "You can only cancel pending orders" });
        }
      }
      // Vendor can update order status
      else if (req.user.role === UserRole.VENDOR) {
        if (shop.vendorId !== req.user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      // Admin can update any order
      else if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update order status
      const updatedOrder = await storage.updateOrderStatus(id, status);
      console.log("DEBUG: BEFORE EMITTING STATUS", updatedOrder);
      
      // Emit real-time update to the customer
      console.log(`Emitting to room: customer-${customerId}`, { orderId: id, status });
      io.to(`customer-${customerId}`).emit("order-status-update", {
        orderId: id,
        status,
      });

      console.log("DEBUG: After EMITTING STATUS", updatedOrder);


      // Fetch order items
      const items = await storage.getOrderItemsByOrderId(id);
      
      res.json({ ...updatedOrder, items });
    } catch (error) {
      console.log("Error updating order status:", error);
      
      res.status(500).json({ message: "Failed to update order status", error });
    }
  });

  // Reviews Routes
  app.get("/api/shops/:shopId/reviews", async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      const reviews = await storage.getReviewsByShopId(shopId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/shops/:shopId/reviews", ensureAuthenticated, checkRole(UserRole.CUSTOMER), async (req, res) => {
    try {
      const shopId = parseInt(req.params.shopId);
      if (isNaN(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" });
      }
      
      // Verify shop exists
      const shop = await storage.getShopById(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      // Validate review data
      const validation = insertReviewSchema.safeParse({
        ...req.body,
        customerId: req.user.id,
        shopId
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid review data", errors: validation.error.errors });
      }
      
      // Check if order ID is provided and valid
      if (validation.data.orderId) {
        const order = await storage.getOrderById(validation.data.orderId);
        if (!order || order.customerId !== req.user.id || order.shopId !== shopId) {
          return res.status(400).json({ message: "Invalid order" });
        }
      }
      
      const review = await storage.createReview(validation.data);

      // Emit real-time event to the vendor
      io.to(`vendor-${shop.vendorId}`).emit("new-review", {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customerId: review.customerId,
        shopId: review.shopId,
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Customer Routes
  app.get("/api/customer/profile", ensureAuthenticated, checkRole(UserRole.CUSTOMER), async (req, res) => {
    try {
      const profile = await storage.getCustomerProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  app.put("/api/customer/profile", ensureAuthenticated, checkRole(UserRole.CUSTOMER), async (req, res) => {
    try {
      const profile = await storage.getCustomerProfile(req.user.id);
      
      if (!profile) {
        // Create profile if it doesn't exist
        const newProfile = await storage.createCustomerProfile({
          userId: req.user.id,
          ...req.body
        });
        
        return res.json(newProfile);
      }
      
      // Update existing profile
      const updatedProfile = await storage.updateCustomerProfile(req.user.id, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/payments/create-intent", ensureAuthenticated, async (req, res) => {
    try {
      const { amount, currency } = req.body;
  
      // Create a Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Amount in cents (Stripe uses the smallest currency unit)
        currency: currency || "inr",
        payment_method_types: ["card"],
      });
  
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post("/api/payments/create-order", async (req, res) => {
    const { amount, currency } = req.body;
  
    try {
      const order = await razorpay.orders.create({
        amount,
        currency,
      });
      console.log("Razorpay order created:", order);
      
  
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


app.post("/api/payments/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  console.log("Verifying payment:", req.body);
  

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.VITE_RAZORPAY_KEY_SECRET as string)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid signature" });
  }
});

app.get("/api/products/template", (req, res) => {
  // Define the columns for the template
  const templateData = [
    ["name", "description", "mrp", "sellingPrice", "stock", "unit", "image", "isAvailable"],
    ["Product 1", "Description 1", 100, 90, 50, "pcs", "http://example.com/image1.jpg", true],
    ["Product 2", "Description 2", 200, 180, 30, "kg", "http://example.com/image2.jpg", false],
  ];

  // Create a new workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);

  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products Template");

  // Write the workbook to a buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Set headers and send the file
  res.setHeader("Content-Disposition", "attachment; filename=products_template.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

app.post("/api/shops/:shopId/products/upload", upload.single("file"), async (req, res) => {
  const { shopId } = req.params;
  console.log("Incoming request for product upload:", req.params);
  
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("Uploaded file:", file);

  try {
    // Read the uploaded file as a buffer
    const fileBuffer = fs.readFileSync(file.path);

    // Parse the Excel file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log("Parsed sheet data:", sheetData);
    

    // Map the data to your product schema
    const products = sheetData.map((row: any) => ({
      shopId: parseInt(shopId, 10),
      name: row.name,
      description: row.description || "",
      mrp: parseFloat(row.mrp),
      sellingPrice: parseFloat(row.sellingPrice),
      stock: parseInt(row.stock, 10),
      unit: row.unit || "pcs",
      image: row.image || "",
      isAvailable: row.isAvailable === true || row.isAvailable === "true" || row.isAvailable === "TRUE",
    }));

    console.log("Parsed products:", products);
    
    for(const product of products) {
      const validation = insertProductSchema.safeParse(product);
      if (!validation.success) {
        console.error("Validation errors:", validation.error.errors);
        return res.status(400).json({ message: "Invalid product data", errors: validation.error.errors });
      }
      const createdProduct = await storage.createProduct(validation.data);
      console.log("Created product:", createdProduct);
    }

    // Insert products into the database
    // await storage.createProducts(products);

    res.json({ success: true, message: "Products uploaded successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Failed to process the file" });
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(file.path);
  }
});

app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude are required" });
  }

  try {
    const latlng = `${lat},${lng}`;
    console.log("Reverse geocode requestLATLNG:", latlng);
    
    const response = await fetch(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${encodeURIComponent(latlng)}&api_key=ISSwHzT4z2Yv352gjpvBNilT5f8w3Pn6nAB8CUuG`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Ola Maps API error:", response.status, errorBody);
      return res.status(response.status).json({ error: errorBody });
    }

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching reverse geocode:", error);
    res.status(500).json({ error: "Failed to fetch reverse geocode" });
  }
});

app.get("/api/geocode", async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(address as string)}&api_key=ISSwHzT4z2Yv352gjpvBNilT5f8w3Pn6nAB8CUuG`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Geocoding API error:", response.status, errorBody);
      return res.status(response.status).json({ error: errorBody });
    }

    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error("Error fetching geocode:", error);
    res.status(500).json({ error: "Failed to fetch geocode" });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}
