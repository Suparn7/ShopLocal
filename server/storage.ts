import {
  User,
  InsertUser,
  CustomerProfile,
  InsertCustomerProfile,
  Category,
  InsertCategory,
  Shop,
  InsertShop,
  Product,
  InsertProduct,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Review,
  InsertReview,
  users,
  customerProfiles,
  categories,
  shops,
  products,
  orders,
  orderItems,
  reviews,
  UserRoleType,
  insertProductSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Customer Profiles
  getCustomerProfile(userId: number): Promise<CustomerProfile | undefined>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(userId: number, data: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Shops
  getAllShops(): Promise<Shop[]>;
  getShopById(id: number): Promise<Shop | undefined>;
  getShopsByVendorId(vendorId: number): Promise<Shop[]>;
  getNearbyShops(lat: number, lng: number, radius: number): Promise<Shop[]>;
  getShopsByCategory(categoryId: number): Promise<Shop[]>;
  getUsersByRole(role: UserRoleType): Promise<User[]>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: number, data: Partial<InsertShop>): Promise<Shop | undefined>;
  deleteShop(id: number): Promise<boolean>;

  // Products
  getProductsByShopId(shopId: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  createProducts(products: InsertProduct[]): Promise<void>;

  // Orders
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  getOrdersByShopId(shopId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Order Items
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Reviews
  getReviewsByShopId(shopId: number): Promise<Review[]>;
  getReviewsByCustomerId(customerId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  // Customer Profiles
  async getCustomerProfile(userId: number): Promise<CustomerProfile | undefined> {
    const result = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId));
    return result[0];
  }

  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    const [newProfile] = await db.insert(customerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateCustomerProfile(userId: number, data: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    const [updatedProfile] = await db.update(customerProfiles).set(data).where(eq(customerProfiles.userId, userId)).returning();
    return updatedProfile;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result > 0;
  }

  // Shops
  async getAllShops(): Promise<Shop[]> {
    return await db.select().from(shops);
  }

  async getShopById(id: number): Promise<Shop | undefined> {
    const result = await db.select().from(shops).where(eq(shops.id, id));
    return result[0];
  }

  async getShopsByVendorId(vendorId: number): Promise<Shop[]> {
    return await db.select().from(shops).where(eq(shops.vendorId, vendorId));
  }

  async getNearbyShops(lat: number, lng: number, radius: number): Promise<Shop[]> {
    console.log("Fetching nearby shops with coordinates:", lat, lng, "and radius:", radius);
    
    const radiusInMeters = radius * 1000;

    // Simplified query for nearby shops
    return await db.select().from(shops).where(
      sql`latitude IS NOT NULL AND longitude IS NOT NULL AND ST_DistanceSphere(
        ST_MakePoint(${lng}::DOUBLE PRECISION, ${lat}::DOUBLE PRECISION),
        ST_MakePoint(${shops.longitude}::DOUBLE PRECISION, ${shops.latitude}::DOUBLE PRECISION)
      ) <= ${radiusInMeters}`
    );
  }

  async getShopsByCategory(categoryId: number): Promise<Shop[]> {
    return await db.select().from(shops).where(eq(shops.categoryId, categoryId));
  }

  async getUsersByRole(role: UserRoleType) {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  async getOrdersByCustomerId(customerId: number) {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const [newShop] = await db.insert(shops).values(shop).returning();
    return newShop;
  }

  async updateShop(id: number, data: Partial<InsertShop>): Promise<Shop | undefined> {
    const [updatedShop] = await db.update(shops).set(data).where(eq(shops.id, id)).returning();
    return updatedShop;
  }

  async deleteShop(id: number): Promise<boolean> {
    const result = await db.delete(shops).where(eq(shops.id, id));
    return result > 0;
  }

  // Products
  async getProductsByShopId(shopId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.shopId, shopId));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    console.log("Creating product:", product);
    
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result > 0;
  }

  // Orders
  async getOrderById(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async getOrdersByShopId(shopId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.shopId, shopId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }

  // Order Items
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(item).returning();
    return newOrderItem;
  }

  // Reviews
  async getReviewsByShopId(shopId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.shopId, shopId));
  }

  async getReviewsByCustomerId(customerId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.customerId, customerId));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async createProducts(products: InsertProduct[]): Promise<void> {
    try {
        console.log("Creating products:", products);

        // Validate each product against the schema
        products.forEach(product => insertProductSchema.parse(product));

        console.log("Validated products:", products);
        
        // Perform the bulk insert
        await db.insert(products).values(products); // Use the original products array
    } catch (error) {
        console.error("Validation or insertion error:", error);
        throw error;
    }
}
}

// Use DatabaseStorage
export const storage = new DatabaseStorage();