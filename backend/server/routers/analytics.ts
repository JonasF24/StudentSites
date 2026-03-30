import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAllOrders,
  getRecentAnalytics,
  createOrUpdateAnalyticsSnapshot,
} from "../db";

export const analyticsRouter = router({
  /**
   * Get dashboard analytics summary
   */
  getDashboardAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const allOrders = await getAllOrders(undefined, 1000, 0);

      // Calculate metrics
      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter((o) => o.status === "completed").length;
      const pendingOrders = allOrders.filter((o) => o.status === "pending_payment").length;
      const inProgressOrders = allOrders.filter((o) => o.status === "in_progress").length;
      const deliveredOrders = allOrders.filter((o) => o.status === "delivered").length;

      const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.price), 0);
      const completedRevenue = allOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + parseFloat(o.price), 0);

      // Package distribution
      const simpleCount = allOrders.filter((o) => o.packageType === "simple").length;
      const recommendedCount = allOrders.filter((o) => o.packageType === "recommended").length;
      const premiumCount = allOrders.filter((o) => o.packageType === "premium").length;

      // Conversion rate (completed / total)
      const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      // Average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        inProgressOrders,
        deliveredOrders,
        totalRevenue: totalRevenue.toFixed(2),
        completedRevenue: completedRevenue.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        averageOrderValue: averageOrderValue.toFixed(2),
        packageDistribution: {
          simple: simpleCount,
          recommended: recommendedCount,
          premium: premiumCount,
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      throw new Error("Failed to fetch analytics");
    }
  }),

  /**
   * Get revenue trends over time
   */
  getRevenueTrends: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        const analytics = await getRecentAnalytics(input.days);

        const trends = analytics.map((snapshot) => ({
          date: snapshot.date,
          revenue: parseFloat(snapshot.totalRevenue.toString()),
          orders: snapshot.totalOrders,
          completedOrders: snapshot.completedOrders,
        }));

        return trends;
      } catch (error) {
        console.error("Error fetching revenue trends:", error);
        throw new Error("Failed to fetch revenue trends");
      }
    }),

  /**
   * Get package distribution analytics
   */
  getPackageDistribution: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const allOrders = await getAllOrders(undefined, 1000, 0);

      const distribution = {
        simple: {
          count: allOrders.filter((o) => o.packageType === "simple").length,
          revenue: allOrders
            .filter((o) => o.packageType === "simple")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
        recommended: {
          count: allOrders.filter((o) => o.packageType === "recommended").length,
          revenue: allOrders
            .filter((o) => o.packageType === "recommended")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
        premium: {
          count: allOrders.filter((o) => o.packageType === "premium").length,
          revenue: allOrders
            .filter((o) => o.packageType === "premium")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
      };

      return distribution;
    } catch (error) {
      console.error("Error fetching package distribution:", error);
      throw new Error("Failed to fetch package distribution");
    }
  }),

  /**
   * Get order status breakdown
   */
  getOrderStatusBreakdown: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const allOrders = await getAllOrders(undefined, 1000, 0);

      const breakdown = {
        pending_payment: {
          count: allOrders.filter((o) => o.status === "pending_payment").length,
          revenue: allOrders
            .filter((o) => o.status === "pending_payment")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
        in_progress: {
          count: allOrders.filter((o) => o.status === "in_progress").length,
          revenue: allOrders
            .filter((o) => o.status === "in_progress")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
        delivered: {
          count: allOrders.filter((o) => o.status === "delivered").length,
          revenue: allOrders
            .filter((o) => o.status === "delivered")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
        completed: {
          count: allOrders.filter((o) => o.status === "completed").length,
          revenue: allOrders
            .filter((o) => o.status === "completed")
            .reduce((sum, o) => sum + parseFloat(o.price), 0),
        },
      };

      return breakdown;
    } catch (error) {
      console.error("Error fetching order status breakdown:", error);
      throw new Error("Failed to fetch order status breakdown");
    }
  }),

  /**
   * Refresh analytics snapshot (admin only)
   */
  refreshAnalytics: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const allOrders = await getAllOrders(undefined, 1000, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter((o) => o.status === "completed").length;
      const pendingOrders = allOrders.filter((o) => o.status === "pending_payment").length;

      const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.price), 0);
      const simpleCount = allOrders.filter((o) => o.packageType === "simple").length;
      const recommendedCount = allOrders.filter((o) => o.packageType === "recommended").length;
      const premiumCount = allOrders.filter((o) => o.packageType === "premium").length;

      const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      await createOrUpdateAnalyticsSnapshot(
        today,
        totalOrders,
        totalRevenue.toFixed(2),
        completedOrders,
        pendingOrders,
        simpleCount,
        recommendedCount,
        premiumCount,
        conversionRate.toFixed(2)
      );

      return {
        success: true,
        message: "Analytics snapshot updated",
      };
    } catch (error) {
      console.error("Error refreshing analytics:", error);
      throw new Error("Failed to refresh analytics");
    }
  }),
});
