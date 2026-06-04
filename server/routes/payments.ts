/**
 * Payment Routes — Razorpay order creation, verification, subscription management
 */
import { RequestHandler } from "express";
import { query, queryOne } from "../db/index";
import {
  PLANS,
  PlanType,
  createOrder,
  verifySignature,
  getSubscriptionStatus,
  activateSubscription,
  validateCoupon,
} from "../services/payment-service";
import {
  sendPaymentConfirmation,
  notifyAdminPayment,
} from "../services/invoice-service";
import crypto from "crypto";

// ── GET /api/payments/subscription — Current user's subscription status ──────
export const handleGetSubscription: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const status = await getSubscriptionStatus(userId);
    res.json(status);
  } catch (err) {
    console.error("[payments] Get subscription error:", err);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
};

// ── POST /api/payments/create-order — Create Razorpay order ──────────────────
export const handleCreateOrder: RequestHandler = async (req, res) => {
  try {
    const { userId, planType, couponCode } = req.body as {
      userId: string;
      planType: PlanType;
      couponCode?: string;
    };

    if (!userId || !planType) {
      return res.status(400).json({ error: "userId and planType are required" });
    }

    const plan = PLANS[planType];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan type. Use 'weekly' or 'monthly'." });
    }

    let amount = plan.amount;
    let discountPercent = 0;
    let appliedCoupon: string | null = null;

    // Apply coupon if provided
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode);
      if (!couponResult.valid) {
        return res.status(400).json({ error: couponResult.message });
      }
      discountPercent = couponResult.discountPercent;
      const discount = Math.round(amount * (discountPercent / 100));
      amount = amount - discount;
      appliedCoupon = couponCode.toUpperCase().trim();
    }

    // Create Razorpay order
    const receipt = `ch_${userId.substring(0, 8)}_${Date.now()}`;
    const order = await createOrder(amount, "INR", receipt, {
      userId,
      planType,
      couponCode: appliedCoupon || "",
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planType,
      planLabel: plan.label,
      originalAmount: plan.amount,
      discountPercent,
      discountAmount: plan.amount - (order.amount as number),
      couponApplied: appliedCoupon,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[payments] Create order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// ── POST /api/payments/verify — Verify payment signature + activate ──────────
export const handleVerifyPayment: RequestHandler = async (req, res) => {
  try {
    const {
      userId,
      planType,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      method,
      couponCode,
      discountAmount,
    } = req.body;

    if (!userId || !planType || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required payment verification fields" });
    }

    // Verify signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
    }

    // Get plan amount
    const plan = PLANS[planType as PlanType];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const finalAmount = plan.amount - (discountAmount || 0);

    // Activate subscription
    const result = await activateSubscription(
      userId,
      planType as PlanType,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      finalAmount,
      method || "unknown",
      couponCode,
      discountAmount
    );

    // Get user info for emails
    const user = await queryOne<{ name: string; email: string }>(
      "SELECT name, email FROM users WHERE id = $1",
      [userId]
    );

    if (user) {
      const paymentData = {
        invoice_number: result.invoiceNumber,
        amount: finalAmount,
        discount_amount: discountAmount || 0,
        method: method || "unknown",
        coupon_code: couponCode || null,
        created_at: new Date().toISOString(),
      };

      // Send emails asynchronously (don't block response)
      sendPaymentConfirmation(user, paymentData, plan.name, result.periodEnd).catch(console.error);
      notifyAdminPayment(user, paymentData, plan.name).catch(console.error);
    }

    res.json({
      success: true,
      message: "Payment verified and subscription activated!",
      invoiceNumber: result.invoiceNumber,
      periodEnd: result.periodEnd,
    });
  } catch (err) {
    console.error("[payments] Verify payment error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

// ── POST /api/payments/apply-coupon — Validate coupon code ───────────────────
export const handleApplyCoupon: RequestHandler = async (req, res) => {
  try {
    const { code, planType } = req.body;
    if (!code) return res.status(400).json({ error: "Coupon code is required" });

    const result = await validateCoupon(code);
    if (!result.valid) {
      return res.status(400).json({ error: result.message });
    }

    // Calculate discounted amount
    const plan = PLANS[planType as PlanType];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan type" });
    }

    const discountAmount = Math.round(plan.amount * (result.discountPercent / 100));
    const finalAmount = plan.amount - discountAmount;

    res.json({
      valid: true,
      discountPercent: result.discountPercent,
      discountAmount,
      finalAmount,
      message: result.message,
    });
  } catch (err) {
    console.error("[payments] Apply coupon error:", err);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
};

// ── POST /api/payments/cancel — Cancel subscription ──────────────────────────
export const handleCancelSubscription: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    await query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, message: "Subscription cancelled. Access continues until the current period ends." });
  } catch (err) {
    console.error("[payments] Cancel subscription error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};

// ── GET /api/payments/history — User's payment history ───────────────────────
export const handleGetPaymentHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const payments = await query(
      `SELECT id, razorpay_payment_id, amount, currency, status, method, invoice_number, coupon_code, discount_amount, created_at
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({ payments });
  } catch (err) {
    console.error("[payments] Get history error:", err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};

// ── POST /api/payments/webhook — Razorpay webhook ────────────────────────────
export const handleWebhook: RequestHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
    const signature = req.headers["x-razorpay-signature"] as string;

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("[webhook] Invalid signature");
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    console.log(`[webhook] Received event: ${event}`);

    // Handle specific events if needed
    switch (event) {
      case "payment.captured":
        console.log("[webhook] Payment captured:", req.body.payload?.payment?.entity?.id);
        break;
      case "payment.failed":
        console.log("[webhook] Payment failed:", req.body.payload?.payment?.entity?.id);
        break;
      default:
        console.log(`[webhook] Unhandled event: ${event}`);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[webhook] Error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
