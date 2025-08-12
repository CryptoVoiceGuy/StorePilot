import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productUrl: text("product_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  storeName: text("store_name"),
  shopifyUrl: text("shopify_url"),
  adminUrl: text("admin_url"),
  productData: jsonb("product_data"),
  generatedContent: jsonb("generated_content"),
  buildLogs: jsonb("build_logs"),
  targetMarket: text("target_market").default("US"),
  currency: text("currency").default("USD"),
  margin: integer("margin").default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// OAuth tokens for Shopify stores
export const shopifyStores = pgTable("shopify_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  shopDomain: text("shop_domain").notNull().unique(), // e.g., "mystore.myshopify.com"
  accessToken: text("access_token").notNull(), // OAuth access token
  scope: text("scope"), // OAuth scopes granted
  isActive: boolean("is_active").default(true),
  referralStatus: text("referral_status"), // "pending", "active", "converted"
  referralDate: timestamp("referral_date"),
  commissionTier: text("commission_tier"), // "basic", "shopify", "advanced"
  monthlyCommission: integer("monthly_commission"), // In cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Track referral links and conversions
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  referralCode: text("referral_code").notNull().unique(),
  customerEmail: text("customer_email"),
  status: text("status").default("pending"), // "pending", "clicked", "signed_up", "converted"
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  shopifyStoreId: varchar("shopify_store_id").references(() => shopifyStores.id),
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  productUrl: true,
  targetMarket: true,
  currency: true,
  margin: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  config: true,
});

export const insertShopifyStoreSchema = createInsertSchema(shopifyStores).pick({
  userId: true,
  projectId: true,
  shopDomain: true,
  accessToken: true,
  scope: true,
  referralStatus: true,
  commissionTier: true,
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  userId: true,
  projectId: true,
  referralCode: true,
  customerEmail: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertShopifyStore = z.infer<typeof insertShopifyStoreSchema>;
export type ShopifyStore = typeof shopifyStores.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
