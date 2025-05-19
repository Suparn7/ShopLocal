import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Role Enum
export const UserRole = {
  CUSTOMER: "customer",
  VENDOR: "vendor",
  ADMIN: "admin",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  password: text("password").notNull(),
  role: text("role").$type<UserRoleType>().notNull().default(UserRole.CUSTOMER),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Customer Profile Schema
export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
});

// Shop Categories Schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameHi: text("name_hi").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull().default("#FF5722"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

// Shop Schema
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code"),
  gstin: text("gstin"),
  isGstVerified: boolean("is_gst_verified").default(false),
  isApproved: boolean("is_approved").default(false),
  isOpen: boolean("is_open").default(true),
  deliveryAvailable: boolean("delivery_available").default(true),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  avgDeliveryTime: integer("avg_delivery_time"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
});

// Products Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull().references(() => shops.id),
  name: text("name").notNull(),
  description: text("description"),
  mrp: doublePrecision("mrp").notNull(),
  sellingPrice: doublePrecision("selling_price").notNull(),
  stock: integer("stock").notNull().default(0),
  unit: text("unit"),
  image: text("image"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

// Order Status Enum
export const OrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

// Payment Method Enum
export const PaymentMethod = {
  UPI: "upi",
  CASH: "cash",
  CARD: "card",
} as const;

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

// Orders Schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id),
  shopId: integer("shop_id").notNull().references(() => shops.id),
  status: text("status").$type<OrderStatusType>().notNull().default(OrderStatus.PENDING),
  totalAmount: doublePrecision("total_amount").notNull(),
  paymentMethod: text("payment_method").$type<PaymentMethodType>().notNull(),
  paymentStatus: boolean("payment_status").default(false),
  deliveryAddress: text("delivery_address"),
  deliveryLatitude: doublePrecision("delivery_latitude"),
  deliveryLongitude: doublePrecision("delivery_longitude"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Order Items Schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

// Reviews Schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id),
  shopId: integer("shop_id").notNull().references(() => shops.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  customerProfile: one(customerProfiles, {
    fields: [users.id],
    references: [customerProfiles.userId],
  }),
  shops: many(shops),
  orders: many(orders),
  reviews: many(reviews),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  shops: many(shops),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  vendor: one(users, {
    fields: [shops.vendorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [shops.categoryId],
    references: [categories.id],
  }),
  products: many(products),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [reviews.shopId],
    references: [shops.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Shop = typeof shops.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
