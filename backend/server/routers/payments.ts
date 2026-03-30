import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createPayment,
  getPaymentByStripeIntentId,
  updatePaymentStatus,
  getOrderById,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "../db";

export const paymentsRouter = router({
  /**
   * Create a payment intent (called from frontend before Stripe checkout)
   */
  createPaymentIntent: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.string(),
        customerEmail: z.string().email(),
        stripePaymentIntentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Verify order exists
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Create payment record
        await createPayment(
          input.orderId,
          input.stripePaymentIntentId,
          input.amount,
          input.customerEmail
        );

        return {
          success: true,
          message: "Payment intent created",
          paymentId: input.stripePaymentIntentId,
        };
      } catch (error) {
        console.error("Error creating payment intent:", error);
        throw new Error("Failed to create payment intent");
      }
    }),

  /**
   * Handle Stripe webhook for payment success
   * This is called from Stripe webhook endpoint
   */
  handlePaymentSuccess: publicProcedure
    .input(
      z.object({
        stripePaymentIntentId: z.string(),
        receiptUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const payment = await getPaymentByStripeIntentId(input.stripePaymentIntentId);
        if (!payment) {
          throw new Error("Payment not found");
        }

        // Update payment status
        await updatePaymentStatus(payment.id, "succeeded", input.receiptUrl);

        // Update order payment status and move to in_progress
        await updateOrderPaymentStatus(payment.orderId, "completed", input.stripePaymentIntentId);
        await updateOrderStatus(payment.orderId, "in_progress");

        return {
          success: true,
          message: "Payment processed successfully",
          orderId: payment.orderId,
        };
      } catch (error) {
        console.error("Error handling payment success:", error);
        throw new Error("Failed to process payment");
      }
    }),

  /**
   * Handle Stripe webhook for payment failure
   */
  handlePaymentFailure: publicProcedure
    .input(
      z.object({
        stripePaymentIntentId: z.string(),
        failureReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const payment = await getPaymentByStripeIntentId(input.stripePaymentIntentId);
        if (!payment) {
          throw new Error("Payment not found");
        }

        // Update payment status to failed
        await updatePaymentStatus(payment.id, "failed", undefined);

        // Update order payment status to failed
        await updateOrderPaymentStatus(payment.orderId, "failed");

        return {
          success: true,
          message: "Payment failure recorded",
          orderId: payment.orderId,
        };
      } catch (error) {
        console.error("Error handling payment failure:", error);
        throw new Error("Failed to record payment failure");
      }
    }),

  /**
   * Get payment details
   */
  getPayment: publicProcedure
    .input(z.object({ stripePaymentIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const payment = await getPaymentByStripeIntentId(input.stripePaymentIntentId);
        if (!payment) {
          throw new Error("Payment not found");
        }

        return payment;
      } catch (error) {
        console.error("Error fetching payment:", error);
        throw new Error("Failed to fetch payment");
      }
    }),

  /**
   * Admin: Get all payments
   */
  getAllPayments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      // This would need a db query helper
      // For now, returning a placeholder
      return {
        message: "Payments query requires additional db helper",
      };
    } catch (error) {
      console.error("Error fetching payments:", error);
      throw new Error("Failed to fetch payments");
    }
  }),
});
