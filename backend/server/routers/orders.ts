import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createOrder,
  getOrderById,
  getOrderByOrderId,
  getOrdersByCustomerId,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderDeliveryDate,
  getOrCreateCustomer,
  getRevisionsByOrderId,
  getRevisionCount,
  getFilesByOrderId,
} from "../db";
import { nanoid } from "nanoid";

export const ordersRouter = router({
  /**
   * Create a new order from form submission
   * This is typically called from Google Forms webhook or similar
   */
  createOrder: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        fullName: z.string(),
        phone: z.string().optional(),
        schoolName: z.string().optional(),
        grade: z.string().optional(),
        packageType: z.enum(["simple", "recommended", "premium"]),
        price: z.string(),
        formData: z.string(), // JSON stringified form data
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get or create customer
        const customer = await getOrCreateCustomer(
          input.email,
          input.fullName,
          input.phone,
          input.schoolName,
          input.grade
        );

        // Generate unique order ID
        const orderId = `ORD-${Date.now()}-${nanoid(8)}`;

        // Create order
        await createOrder(
          customer.id,
          orderId,
          input.packageType,
          input.price,
          input.formData
        );

        const newOrder = await getOrderByOrderId(orderId);

        return {
          success: true,
          orderId: newOrder?.orderId,
          orderDbId: newOrder?.id,
          message: "Order created successfully",
        };
      } catch (error) {
        console.error("Error creating order:", error);
        throw new Error("Failed to create order");
      }
    }),

  /**
   * Get order details by order ID
   */
  getOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      try {
        const order = await getOrderByOrderId(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Get associated data
        const revisions = await getRevisionsByOrderId(order.id);
        const files = await getFilesByOrderId(order.id);

        return {
          ...order,
          revisions,
          files,
          formData: JSON.parse(order.formData),
        };
      } catch (error) {
        console.error("Error fetching order:", error);
        throw new Error("Failed to fetch order");
      }
    }),

  /**
   * Get all orders for a customer
   */
  getCustomerOrders: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const orders = await getOrdersByCustomerId(input.customerId);
        return orders.map((order) => ({
          ...order,
          formData: JSON.parse(order.formData),
        }));
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        throw new Error("Failed to fetch customer orders");
      }
    }),

  /**
   * Admin: Get all orders with optional filtering
   */
  getAllOrders: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const orders = await getAllOrders(input.status, input.limit, input.offset);
        return orders.map((order) => ({
          ...order,
          formData: JSON.parse(order.formData),
        }));
      } catch (error) {
        console.error("Error fetching all orders:", error);
        throw new Error("Failed to fetch orders");
      }
    }),

  /**
   * Admin: Update order status
   */
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending_payment", "in_progress", "delivered", "completed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        await updateOrderStatus(input.orderId, input.status);
        return { success: true, message: "Order status updated" };
      } catch (error) {
        console.error("Error updating order status:", error);
        throw new Error("Failed to update order status");
      }
    }),

  /**
   * Update order payment status (called from Stripe webhook)
   */
  updatePaymentStatus: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentStatus: z.enum(["pending", "completed", "failed"]),
        stripePaymentIntentId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateOrderPaymentStatus(
          input.orderId,
          input.paymentStatus,
          input.stripePaymentIntentId
        );

        // If payment is completed, update order status to in_progress
        if (input.paymentStatus === "completed") {
          await updateOrderStatus(input.orderId, "in_progress");
        }

        return { success: true, message: "Payment status updated" };
      } catch (error) {
        console.error("Error updating payment status:", error);
        throw new Error("Failed to update payment status");
      }
    }),

  /**
   * Mark order as delivered
   */
  markAsDelivered: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        await updateOrderDeliveryDate(input.orderId);
        return { success: true, message: "Order marked as delivered" };
      } catch (error) {
        console.error("Error marking order as delivered:", error);
        throw new Error("Failed to mark order as delivered");
      }
    }),

  /**
   * Get order statistics for dashboard
   */
  getOrderStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const allOrders = await getAllOrders(undefined, 1000, 0);

      const stats = {
        total: allOrders.length,
        pendingPayment: allOrders.filter((o) => o.status === "pending_payment").length,
        inProgress: allOrders.filter((o) => o.status === "in_progress").length,
        delivered: allOrders.filter((o) => o.status === "delivered").length,
        completed: allOrders.filter((o) => o.status === "completed").length,
        totalRevenue: allOrders.reduce((sum, o) => sum + parseFloat(o.price), 0),
      };

      return stats;
    } catch (error) {
      console.error("Error fetching order stats:", error);
      throw new Error("Failed to fetch order statistics");
    }
  }),
});
