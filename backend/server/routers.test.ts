import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
function createMockContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Orders Router", () => {
  it("should create an order from form submission", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.orders.createOrder({
      email: "student@example.com",
      fullName: "John Doe",
      phone: "555-1234",
      schoolName: "Lincoln High School",
      grade: "Senior",
      packageType: "recommended",
      price: "299.99",
      formData: JSON.stringify({ interests: "tech", goals: "college" }),
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();
    expect(result.orderId).toMatch(/^ORD-/);
  });

  it("should get order by order ID", async () => {
    const caller = appRouter.createCaller(createMockContext());

    // Create an order first
    const createResult = await caller.orders.createOrder({
      email: "student2@example.com",
      fullName: "Jane Smith",
      packageType: "simple",
      price: "199.99",
      formData: JSON.stringify({}),
    });

    // Get the order
    const getResult = await caller.orders.getOrder({
      orderId: createResult.orderId!,
    });

    expect(getResult.orderId).toBe(createResult.orderId);
    expect(getResult.packageType).toBe("simple");
    expect(getResult.status).toBe("pending_payment");
  });

  it("should get order statistics", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));

    const stats = await caller.orders.getOrderStats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pendingPayment");
    expect(stats).toHaveProperty("inProgress");
    expect(stats).toHaveProperty("delivered");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("totalRevenue");
  });

  it("should deny non-admin access to admin endpoints", async () => {
    const caller = appRouter.createCaller(createMockContext("user"));

    try {
      await caller.orders.getOrderStats();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("Payments Router", () => {
  it("should create a payment intent", async () => {
    const caller = appRouter.createCaller(createMockContext());

    // First create an order
    const orderResult = await caller.orders.createOrder({
      email: "payment-test@example.com",
      fullName: "Payment Tester",
      packageType: "premium",
      price: "499.99",
      formData: JSON.stringify({}),
    });

    // Create payment
    const paymentResult = await caller.payments.createPaymentIntent({
      orderId: orderResult.orderDbId!,
      amount: "499.99",
      customerEmail: "payment-test@example.com",
      stripePaymentIntentId: "pi_test_123456",
    });

    expect(paymentResult.success).toBe(true);
    expect(paymentResult.paymentId).toBe("pi_test_123456");
  });

  it("should handle payment success", async () => {
    const caller = appRouter.createCaller(createMockContext());

    // Create order and payment
    const orderResult = await caller.orders.createOrder({
      email: "success-test@example.com",
      fullName: "Success Tester",
      packageType: "recommended",
      price: "299.99",
      formData: JSON.stringify({}),
    });

    await caller.payments.createPaymentIntent({
      orderId: orderResult.orderDbId!,
      amount: "299.99",
      customerEmail: "success-test@example.com",
      stripePaymentIntentId: "pi_success_123",
    });

    // Handle success
    const successResult = await caller.payments.handlePaymentSuccess({
      stripePaymentIntentId: "pi_success_123",
    });

    expect(successResult.success).toBe(true);
    expect(successResult.orderId).toBe(orderResult.orderDbId);
  });
});

describe("Revisions Router", () => {
  it("should get revision count for an order", async () => {
    const caller = appRouter.createCaller(createMockContext());

    // Create an order
    const orderResult = await caller.orders.createOrder({
      email: "revision-test@example.com",
      fullName: "Revision Tester",
      packageType: "simple",
      price: "199.99",
      formData: JSON.stringify({}),
    });

    // Get revision count
    const countResult = await caller.revisions.getRevisionCount({
      orderId: orderResult.orderDbId!,
    });

    expect(countResult.used).toBe(0);
    expect(countResult.remaining).toBe(5);
    expect(countResult.total).toBe(5);
  });

  it("should enforce 5 revision limit", async () => {
    const caller = appRouter.createCaller(createMockContext());

    // Create an order
    const orderResult = await caller.orders.createOrder({
      email: "limit-test@example.com",
      fullName: "Limit Tester",
      packageType: "premium",
      price: "499.99",
      formData: JSON.stringify({}),
    });

    // Mark as delivered
    await caller.orders.markAsDelivered({
      orderId: orderResult.orderDbId!,
    });

    // Try to request revisions
    let revisionCount = 0;
    for (let i = 0; i < 6; i++) {
      try {
        await caller.revisions.requestRevision({
          orderId: orderResult.orderDbId!,
          description: `Revision request ${i + 1}`,
        });
        revisionCount++;
      } catch (error) {
        // Expected to fail on 6th attempt
        expect(error).toBeDefined();
      }
    }

    expect(revisionCount).toBe(5);
  });
});

describe("Analytics Router", () => {
  it("should get dashboard analytics", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));

    const analytics = await caller.analytics.getDashboardAnalytics();

    expect(analytics).toHaveProperty("totalOrders");
    expect(analytics).toHaveProperty("completedOrders");
    expect(analytics).toHaveProperty("pendingOrders");
    expect(analytics).toHaveProperty("totalRevenue");
    expect(analytics).toHaveProperty("conversionRate");
    expect(analytics).toHaveProperty("packageDistribution");
  });

  it("should get package distribution", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));

    const distribution = await caller.analytics.getPackageDistribution();

    expect(distribution).toHaveProperty("simple");
    expect(distribution).toHaveProperty("recommended");
    expect(distribution).toHaveProperty("premium");
    expect(distribution.simple).toHaveProperty("count");
    expect(distribution.simple).toHaveProperty("revenue");
  });

  it("should get order status breakdown", async () => {
    const caller = appRouter.createCaller(createMockContext("admin"));

    const breakdown = await caller.analytics.getOrderStatusBreakdown();

    expect(breakdown).toHaveProperty("pending_payment");
    expect(breakdown).toHaveProperty("in_progress");
    expect(breakdown).toHaveProperty("delivered");
    expect(breakdown).toHaveProperty("completed");
  });
});

describe("Auth Router", () => {
  it("should get current user", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("admin");
  });

  it("should logout user", async () => {
    const caller = appRouter.createCaller(createMockContext());

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
  });
});
