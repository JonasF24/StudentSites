import { Request, Response } from "express";
import { getPaymentByStripeIntentId, updatePaymentStatus, updateOrderPaymentStatus, updateOrderStatus } from "../db";

/**
 * Handle Stripe webhook events
 * This should be called from your Express server at POST /api/webhooks/stripe
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const event = req.body;

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    res.status(400).json({ error: "Webhook handler failed" });
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const { id: stripePaymentIntentId, receipt_email, charges } = paymentIntent;

    // Find payment in database
    const payment = await getPaymentByStripeIntentId(stripePaymentIntentId);
    if (!payment) {
      console.warn(`Payment not found for intent: ${stripePaymentIntentId}`);
      return;
    }

    // Get receipt URL from charge
    const receiptUrl = charges?.data?.[0]?.receipt_url;

    // Update payment status
    await updatePaymentStatus(payment.id, "succeeded", receiptUrl);

    // Update order payment status and move to in_progress
    await updateOrderPaymentStatus(payment.orderId, "completed", stripePaymentIntentId);
    await updateOrderStatus(payment.orderId, "in_progress");

    console.log(`Payment succeeded for order: ${payment.orderId}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const { id: stripePaymentIntentId, last_payment_error } = paymentIntent;

    // Find payment in database
    const payment = await getPaymentByStripeIntentId(stripePaymentIntentId);
    if (!payment) {
      console.warn(`Payment not found for intent: ${stripePaymentIntentId}`);
      return;
    }

    // Get failure reason
    const failureReason = last_payment_error?.message || "Payment failed";

    // Update payment status to failed
    await updatePaymentStatus(payment.id, "failed", undefined);

    // Update order payment status to failed
    await updateOrderPaymentStatus(payment.orderId, "failed");

    console.log(`Payment failed for order: ${payment.orderId} - ${failureReason}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: any) {
  try {
    const { payment_intent: stripePaymentIntentId, refunded } = charge;

    if (!refunded) {
      return;
    }

    // Find payment in database
    const payment = await getPaymentByStripeIntentId(stripePaymentIntentId);
    if (!payment) {
      console.warn(`Payment not found for intent: ${stripePaymentIntentId}`);
      return;
    }

    // Update payment status to failed (refunded)
    await updatePaymentStatus(payment.id, "failed", undefined);

    // Update order payment status
    await updateOrderPaymentStatus(payment.orderId, "failed");

    console.log(`Charge refunded for order: ${payment.orderId}`);
  } catch (error) {
    console.error("Error handling charge refund:", error);
    throw error;
  }
}
