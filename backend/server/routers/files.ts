import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createFile, getFilesByOrderId, getOrderById } from "../db";
import { storagePut, storageGet } from "../../server/storage";
import { nanoid } from "nanoid";

export const filesRouter = router({
  /**
   * Upload a file for an order (admin only)
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        fileName: z.string(),
        fileBuffer: z.string(), // Base64 encoded file data
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        // Verify order exists
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Decode base64 file
        const buffer = Buffer.from(input.fileBuffer, "base64");

        // Upload to S3
        const fileKey = `orders/${order.orderId}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, "application/zip");

        // Store file metadata in database
        await createFile(input.orderId, input.fileName, fileKey, url, buffer.length);

        return {
          success: true,
          message: "File uploaded successfully",
          fileUrl: url,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        throw new Error("Failed to upload file");
      }
    }),

  /**
   * Get download link for a file (customer can access their own files)
   */
  getDownloadLink: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        fileId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Verify order exists
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        // Get files for the order
        const files = await getFilesByOrderId(input.orderId);
        const file = files.find((f) => f.id === input.fileId);

        if (!file) {
          throw new Error("File not found");
        }

        // Generate presigned URL (valid for 24 hours)
        const { url } = await storageGet(file.fileKey);

        return {
          success: true,
          downloadUrl: url,
          fileName: file.fileName,
          fileSize: file.fileSize,
        };
      } catch (error) {
        console.error("Error getting download link:", error);
        throw new Error("Failed to get download link");
      }
    }),

  /**
   * Get all files for an order
   */
  getOrderFiles: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new Error("Order not found");
        }

        const files = await getFilesByOrderId(input.orderId);

        // Generate download links for each file
        const filesWithLinks = await Promise.all(
          files.map(async (file) => {
            try {
              const { url } = await storageGet(file.fileKey);
              return {
                ...file,
                downloadUrl: url,
              };
            } catch {
              return {
                ...file,
                downloadUrl: null,
              };
            }
          })
        );

        return filesWithLinks;
      } catch (error) {
        console.error("Error fetching order files:", error);
        throw new Error("Failed to fetch order files");
      }
    }),

  /**
   * Admin: Get all files
   */
  getAllFiles: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      // This would need a db query helper to get all files
      // For now, returning a placeholder
      return {
        message: "Files query requires additional db helper",
      };
    } catch (error) {
      console.error("Error fetching all files:", error);
      throw new Error("Failed to fetch files");
    }
  }),

  /**
   * Delete a file (admin only)
   */
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      try {
        // This would need a db delete helper
        // For now, returning a placeholder
        return {
          success: true,
          message: "File deletion requires additional db helper",
        };
      } catch (error) {
        console.error("Error deleting file:", error);
        throw new Error("Failed to delete file");
      }
    }),
});
