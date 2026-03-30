import { Request, Response } from "express";
import { createOrder, getOrCreateCustomer } from "../db";
import { nanoid } from "nanoid";

/**
 * Handle Google Forms webhook
 * This should be called from your Express server at POST /api/webhooks/google-forms
 * 
 * Expected payload structure:
 * {
 *   email: string,
 *   fullName: string,
 *   phone?: string,
 *   schoolName?: string,
 *   grade?: string,
 *   packageType: 'simple' | 'recommended' | 'premium',
 *   price: string,
 *   formData: object (entire form submission)
 * }
 */
export async function handleGoogleFormsWebhook(req: Request, res: Response) {
  try {
    const { email, fullName, phone, schoolName, grade, packageType, price, formData } = req.body;

    // Validate required fields
    if (!email || !fullName || !packageType || !price) {
      return res.status(400).json({
        error: "Missing required fields: email, fullName, packageType, price",
      });
    }

    // Validate package type
    if (!["simple", "recommended", "premium"].includes(packageType)) {
      return res.status(400).json({
        error: "Invalid packageType. Must be one of: simple, recommended, premium",
      });
    }

    // Get or create customer
    const customer = await getOrCreateCustomer(email, fullName, phone, schoolName, grade);

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${nanoid(8)}`;

    // Create order
    await createOrder(
      customer.id,
      orderId,
      packageType as "simple" | "recommended" | "premium",
      price,
      JSON.stringify(formData || {})
    );

    res.json({
      success: true,
      orderId,
      message: "Order created successfully from form submission",
    });
  } catch (error) {
    console.error("Error handling Google Forms webhook:", error);
    res.status(500).json({
      error: "Failed to process form submission",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Validate webhook signature (if using signed webhooks)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // This is a placeholder for webhook signature validation
  // Implement according to your webhook provider's requirements
  return true;
}
