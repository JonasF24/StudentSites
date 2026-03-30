import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  longtext,
  index,
  foreignKey,
  unique,
  check,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow (admin users only).
 * Extend this file with additional tables as your product grows.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for OAuth
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  password: varchar("password", { length: 255 }), // For email/password auth
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"), // 'email' or 'oauth'
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Customers table - stores student/customer information from order forms
 */
export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    schoolName: varchar("schoolName", { length: 255 }),
    grade: varchar("grade", { length: 50 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("customers_email_idx").on(table.email),
  })
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Orders table - tracks all website orders
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId").notNull(),
    orderId: varchar("orderId", { length: 64 }).notNull().unique(), // Unique order identifier for customer reference
    packageType: mysqlEnum("packageType", ["simple", "recommended", "premium"]).notNull(),
    status: mysqlEnum("status", [
      "pending_payment",
      "in_progress",
      "delivered",
      "completed",
    ])
      .default("pending_payment")
      .notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
    formData: longtext("formData").notNull(), // JSON string of the order form submission
    deliveryDate: timestamp("deliveryDate"),
    completedDate: timestamp("completedDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    customerIdFk: foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
    }).onDelete("restrict"),
    customerIdIdx: index("orders_customerId_idx").on(table.customerId),
    statusIdx: index("orders_status_idx").on(table.status),
    paymentStatusIdx: index("orders_paymentStatus_idx").on(table.paymentStatus),
    orderIdIdx: index("orders_orderId_idx").on(table.orderId),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Revisions table - tracks revisions for each order (max 5 per order, 60-day expiration)
 */
export const revisions = mysqlTable(
  "revisions",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    revisionNumber: int("revisionNumber").notNull(), // 1-5
    status: mysqlEnum("status", ["requested", "in_progress", "completed"]).default("requested").notNull(),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    expiresAt: timestamp("expiresAt").notNull(), // 60 days from order delivery
    description: longtext("description").notNull(), // What the customer is requesting
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderIdFk: foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }).onDelete("cascade"),
    revisionNumberCheck: check("revisionNumber", sql`revisionNumber >= 1 AND revisionNumber <= 5`),
    orderIdRevisionNumberUnique: unique("revisions_orderId_revisionNumber_unique").on(
      table.orderId,
      table.revisionNumber
    ),
    orderIdIdx: index("revisions_orderId_idx").on(table.orderId),
    statusIdx: index("revisions_status_idx").on(table.status),
  })
);

export type Revision = typeof revisions.$inferSelect;
export type InsertRevision = typeof revisions.$inferInsert;

/**
 * Files table - stores delivered website files with secure download links
 */
export const files = mysqlTable(
  "files",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileKey: varchar("fileKey", { length: 255 }).notNull(), // S3 key for the file
    fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // S3 URL or presigned URL
    fileSize: int("fileSize"), // File size in bytes
    mimeType: varchar("mimeType", { length: 100 }).default("application/zip"),
    uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    orderIdFk: foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }).onDelete("cascade"),
    orderIdIdx: index("files_orderId_idx").on(table.orderId),
  })
);

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

/**
 * Payments table - tracks all payment transactions
 */
export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }).notNull().unique(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("usd").notNull(),
    status: mysqlEnum("status", ["pending", "succeeded", "failed", "canceled"]).default("pending").notNull(),
    paymentMethod: varchar("paymentMethod", { length: 100 }),
    customerEmail: varchar("customerEmail", { length: 320 }),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
    receiptUrl: varchar("receiptUrl", { length: 1024 }),
    failureReason: text("failureReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderIdFk: foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }).onDelete("restrict"),
    orderIdIdx: index("payments_orderId_idx").on(table.orderId),
    stripePaymentIntentIdIdx: index("payments_stripePaymentIntentId_idx").on(table.stripePaymentIntentId),
    statusIdx: index("payments_status_idx").on(table.status),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Email logs table - tracks all sent emails for audit and retry purposes
 */
export const emailLogs = mysqlTable(
  "emailLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId"),
    customerId: int("customerId"),
    recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
    emailType: mysqlEnum("emailType", [
      "order_confirmation",
      "payment_received",
      "order_in_progress",
      "order_delivered",
      "revision_request",
      "revision_completed",
    ]).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
    sentAt: timestamp("sentAt"),
    failureReason: text("failureReason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    orderIdFk: foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
    }).onDelete("set null"),
    customerIdFk: foreignKey({
      columns: [table.customerId],
      foreignColumns: [customers.id],
    }).onDelete("set null"),
    orderIdIdx: index("emailLogs_orderId_idx").on(table.orderId),
    customerIdIdx: index("emailLogs_customerId_idx").on(table.customerId),
    statusIdx: index("emailLogs_status_idx").on(table.status),
  })
);

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Analytics snapshot table - stores daily analytics for quick dashboard queries
 */
export const analyticsSnapshots = mysqlTable(
  "analyticsSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    date: timestamp("date").notNull().unique(),
    totalOrders: int("totalOrders").default(0).notNull(),
    totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
    completedOrders: int("completedOrders").default(0).notNull(),
    pendingOrders: int("pendingOrders").default(0).notNull(),
    simplePackageCount: int("simplePackageCount").default(0).notNull(),
    recommendedPackageCount: int("recommendedPackageCount").default(0).notNull(),
    premiumPackageCount: int("premiumPackageCount").default(0).notNull(),
    conversionRate: decimal("conversionRate", { precision: 5, scale: 2 }).default("0").notNull(), // percentage
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index("analyticsSnapshots_date_idx").on(table.date),
  })
);

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
