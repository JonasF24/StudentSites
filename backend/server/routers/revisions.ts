import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getRevisionsByOrderId,
  getRevisionCount,
  createRevision,
  updateRevisionStatus,
  getOrderById,
} from "../db";

export const revisionsRouter = router({
  /**
   * Get all revisions for an order
   */
  getRevisions: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const revisions = await getRevisionsByOrderId(input.orderId);
        return revisions;
      } catch (error) {
        console.error("Error fetching revisions:", error);
        throw new Error("Failed to fetch revisions");
      }
    }),

  /**
   * Get revision count for an order
   */
  getRevisionCount: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const count = await getRevisionCount(input.orderId);
        const remaining = 5 - count;
        return {
          used: count,
          remaining: Math.max(0, remaining),
          total: 5,
        };
      } catch (error) {
        console.error("Error fetching revision count:", error);
        throw new Error("Failed to fetch revision count");
      }
    }),

  /**
   * Request a revision for an order
   */
  requestRevision: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        description: z.string().min(10, "Description must be at least 10 characters"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if order exists and is delivered
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        if (order.status !== "delivered" && order.status !== "completed") {
          throw new Error("Order must be delivered before requesting revisions");
        }

        // Check if delivery date exists
        if (!order.deliveryDate) {
          throw new Error("Order delivery date not set");
        }

        // Calculate expiration date (60 days from delivery)
        const expiresAt = new Date(order.deliveryDate);
        expiresAt.setDate(expiresAt.getDate() + 60);

        // Check if revision period has expired
        if (new Date() > expiresAt) {
          throw new Error("Revision period has expired (60 days from delivery)");
        }

        // Check revision count
        const count = await getRevisionCount(input.orderId);
        if (count >= 5) {
          throw new Error("Maximum 5 revisions allowed per order");
        }

        // Create revision
        await createRevision(input.orderId, input.description, expiresAt);

        return {
          success: true,
          message: "Revision requested successfully",
          expiresAt,
        };
      } catch (error) {
        console.error("Error requesting revision:", error);
        throw error;
      }
    }),

  /**
   * Admin: Update revision status
   */
  updateRevisionStatus: protectedProcedure
    .input(
      z.object({
        revisionId: z.number(),
        status: z.enum(["requested", "in_progress", "completed"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        await updateRevisionStatus(input.revisionId, input.status);
        return { success: true, message: "Revision status updated" };
      } catch (error) {
        console.error("Error updating revision status:", error);
        throw new Error("Failed to update revision status");
      }
    }),

  /**
   * Get revision details
   */
  getRevision: publicProcedure
    .input(z.object({ revisionId: z.number() }))
    .query(async ({ input }) => {
      try {
        const revisions = await getRevisionsByOrderId(input.revisionId);
        const revision = revisions.find((r) => r.id === input.revisionId);

        if (!revision) {
          throw new Error("Revision not found");
        }

        return revision;
      } catch (error) {
        console.error("Error fetching revision:", error);
        throw new Error("Failed to fetch revision");
      }
    }),
});
