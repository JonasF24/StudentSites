import { eq, and, desc, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  customers,
  orders,
  revisions,
  payments,
  files,
  emailLogs,
  analyticsSnapshots,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.email) {
    throw new Error("User openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      email: user.email,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CUSTOMER QUERIES ============

export async function getOrCreateCustomer(email: string, fullName: string, phone?: string, schoolName?: string, grade?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to find existing customer
  const existing = await db.select().from(customers).where(eq(customers.email, email)).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new customer
  const result = await db.insert(customers).values({
    email,
    fullName,
    phone,
    schoolName,
    grade,
  });

  const newCustomer = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return newCustomer[0];
}

export async function getCustomerById(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ ORDER QUERIES ============

export async function createOrder(
  customerId: number,
  orderId: string,
  packageType: "simple" | "recommended" | "premium",
  price: string,
  formData: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values({
    customerId,
    orderId,
    packageType,
    price: price as any,
    formData,
    status: "pending_payment",
    paymentStatus: "pending",
  });

  return result;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrderByOrderId(orderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOrdersByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders(status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.status, status as any))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(orders).set({ status: status as any }).where(eq(orders.id, orderId));
}

export async function updateOrderPaymentStatus(orderId: number, paymentStatus: string, stripePaymentIntentId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { paymentStatus: paymentStatus as any };
  if (stripePaymentIntentId) {
    updateData.stripePaymentIntentId = stripePaymentIntentId;
  }

  return await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

export async function updateOrderDeliveryDate(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(orders).set({ deliveryDate: new Date(), status: "delivered" }).where(eq(orders.id, orderId));
}

// ============ REVISION QUERIES ============

export async function getRevisionsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(revisions).where(eq(revisions.orderId, orderId)).orderBy(revisions.revisionNumber);
}

export async function getRevisionCount(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.orderId, orderId), eq(revisions.status, "completed")))
    .orderBy(desc(revisions.revisionNumber))
    .limit(1);

  return result.length > 0 ? result[0].revisionNumber : 0;
}

export async function createRevision(orderId: number, description: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the next revision number
  const lastRevision = await db
    .select()
    .from(revisions)
    .where(eq(revisions.orderId, orderId))
    .orderBy(desc(revisions.revisionNumber))
    .limit(1);

  const nextRevisionNumber = (lastRevision.length > 0 ? lastRevision[0].revisionNumber : 0) + 1;

  if (nextRevisionNumber > 5) {
    throw new Error("Maximum 5 revisions allowed per order");
  }

  return await db.insert(revisions).values({
    orderId,
    revisionNumber: nextRevisionNumber,
    description,
    expiresAt,
    status: "requested",
  });
}

export async function updateRevisionStatus(revisionId: number, status: "requested" | "in_progress" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  return await db.update(revisions).set(updateData).where(eq(revisions.id, revisionId));
}

// ============ PAYMENT QUERIES ============

export async function createPayment(
  orderId: number,
  stripePaymentIntentId: string,
  amount: string,
  customerEmail: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(payments).values({
    orderId,
    stripePaymentIntentId,
    amount: amount as any,
    customerEmail,
    status: "pending",
  });
}

export async function getPaymentByStripeIntentId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updatePaymentStatus(paymentId: number, status: string, receiptUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status: status as any };
  if (receiptUrl) {
    updateData.receiptUrl = receiptUrl;
  }

  return await db.update(payments).set(updateData).where(eq(payments.id, paymentId));
}

// ============ FILE QUERIES ============

export async function createFile(orderId: number, fileName: string, fileKey: string, fileUrl: string, fileSize?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(files).values({
    orderId,
    fileName,
    fileKey,
    fileUrl,
    fileSize,
  });
}

export async function getFilesByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(files).where(eq(files.orderId, orderId));
}

// ============ EMAIL LOG QUERIES ============

export async function createEmailLog(
  recipientEmail: string,
  emailType: string,
  subject: string,
  orderId?: number,
  customerId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(emailLogs).values({
    orderId,
    customerId,
    recipientEmail,
    emailType: emailType as any,
    subject,
    status: "pending",
  });
}

export async function updateEmailLogStatus(emailLogId: number, status: "sent" | "failed", failureReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status, sentAt: new Date() };
  if (failureReason) {
    updateData.failureReason = failureReason;
  }

  return await db.update(emailLogs).set(updateData).where(eq(emailLogs.id, emailLogId));
}

// ============ ANALYTICS QUERIES ============

export async function getAnalyticsSnapshot(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.date, date)).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateAnalyticsSnapshot(
  date: Date,
  totalOrders: number,
  totalRevenue: string,
  completedOrders: number,
  pendingOrders: number,
  simplePackageCount: number,
  recommendedPackageCount: number,
  premiumPackageCount: number,
  conversionRate: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getAnalyticsSnapshot(date);

  if (existing) {
    return await db
      .update(analyticsSnapshots)
      .set({
        totalOrders,
        totalRevenue: totalRevenue as any,
        completedOrders,
        pendingOrders,
        simplePackageCount,
        recommendedPackageCount,
        premiumPackageCount,
        conversionRate: conversionRate as any,
      })
      .where(eq(analyticsSnapshots.date, date));
  } else {
    return await db.insert(analyticsSnapshots).values({
      date,
      totalOrders,
      totalRevenue: totalRevenue as any,
      completedOrders,
      pendingOrders,
      simplePackageCount,
      recommendedPackageCount,
      premiumPackageCount,
      conversionRate: conversionRate as any,
    });
  }
}

export async function getRecentAnalytics(days = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await db
    .select()
    .from(analyticsSnapshots)
    .where(gte(analyticsSnapshots.date, startDate))
    .orderBy(desc(analyticsSnapshots.date));
}
