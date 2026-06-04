/**
 * Payment Service — Razorpay SDK wrapper + subscription logic
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Razorpay = require("razorpay");
import crypto from "crypto";
import { query, queryOne } from "../db/index";

// ── Razorpay Instance ────────────────────────────────────────────────────────
const razorpay = new (Razorpay.default || Razorpay)({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// ── Plan Definitions ─────────────────────────────────────────────────────────
export const PLANS = {
  weekly: { name: "Weekly", amount: 19900, currency: "INR", period: "7 days", label: "₹199/week" },
  monthly: { name: "Monthly", amount: 49900, currency: "INR", period: "30 days", label: "₹499/month" },
} as const;

export type PlanType = keyof typeof PLANS;

// ── Create Razorpay Order ────────────────────────────────────────────────────
export async function createOrder(
  amount: number,
  currency: string,
  receipt: string,
  notes?: Record<string, string>
) {
  const order = await razorpay.orders.create({
    amount, // in paisa
    currency,
    receipt,
    notes: notes || {},
  });
  return order;
}

// ── Verify Payment Signature ─────────────────────────────────────────────────
export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// ── Generate Invoice Number ──────────────────────────────────────────────────
export function generateInvoiceNumber(): string {
  const prefix = "CH";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ── Ensure Subscription Row Exists ───────────────────────────────────────────
export async function ensureSubscription(userId: string) {
  const existing = await queryOne(
    "SELECT id FROM subscriptions WHERE user_id = $1",
    [userId]
  );
  if (!existing) {
    await query(
      `INSERT INTO subscriptions (user_id, plan_type, status, trial_start, trial_end)
       VALUES ($1, 'trial', 'trialing', NOW(), NOW() + INTERVAL '7 days')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    // Also set trial_started_at on users table
    await query(
      "UPDATE users SET trial_started_at = NOW() WHERE id = $1 AND trial_started_at IS NULL",
      [userId]
    );
  }
  return queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [userId]);
}

// ── Get Subscription Status ──────────────────────────────────────────────────
export interface SubscriptionStatus {
  planType: string;
  status: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const sub = await ensureSubscription(userId);

  if (!sub) {
    return {
      planType: "trial",
      status: "trialing",
      trialEnd: null,
      currentPeriodEnd: null,
      daysRemaining: 7,
      isActive: true,
      isTrial: true,
      isExpired: false,
    };
  }

  const now = new Date();
  let isActive = false;
  let isExpired = false;
  let daysRemaining = 0;

  if (sub.status === "trialing") {
    const trialEnd = new Date(sub.trial_end);
    daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    isActive = daysRemaining > 0;
    isExpired = daysRemaining <= 0;

    // Auto-expire trial
    if (isExpired && sub.status === "trialing") {
      await query(
        "UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE id = $1",
        [sub.id]
      );
    }
  } else if (sub.status === "active") {
    const periodEnd = new Date(sub.current_period_end);
    daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    isActive = daysRemaining > 0;
    isExpired = daysRemaining <= 0;

    if (isExpired) {
      await query(
        "UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE id = $1",
        [sub.id]
      );
    }
  } else {
    isExpired = true;
  }

  return {
    planType: sub.plan_type,
    status: isExpired ? "expired" : sub.status,
    trialEnd: sub.trial_end,
    currentPeriodEnd: sub.current_period_end,
    daysRemaining,
    isActive,
    isTrial: sub.status === "trialing",
    isExpired,
  };
}

// ── Boolean check for middleware ──────────────────────────────────────────────
export async function isUserSubscribed(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return status.isActive;
}

// ── Activate Subscription After Payment ──────────────────────────────────────
export async function activateSubscription(
  userId: string,
  planType: PlanType,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  amount: number,
  method: string,
  couponCode?: string,
  discountAmount?: number
) {
  const invoiceNumber = generateInvoiceNumber();
  const periodDays = planType === "weekly" ? 7 : 30;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  // Update or create subscription
  const sub = await queryOne(
    `INSERT INTO subscriptions (user_id, plan_type, status, current_period_start, current_period_end, updated_at)
     VALUES ($1, $2, 'active', NOW(), $3, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       plan_type = $2,
       status = 'active',
       current_period_start = NOW(),
       current_period_end = $3,
       cancelled_at = NULL,
       updated_at = NOW()
     RETURNING id`,
    [userId, planType, periodEnd.toISOString()]
  );

  // Insert payment record
  await query(
    `INSERT INTO payments (user_id, subscription_id, razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, currency, status, method, invoice_number, coupon_code, discount_amount)
     VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'captured', $7, $8, $9, $10)`,
    [userId, sub?.id, razorpayPaymentId, razorpayOrderId, razorpaySignature, amount, method || "unknown", invoiceNumber, couponCode || null, discountAmount || 0]
  );

  // Increment coupon usage if used
  if (couponCode) {
    await query(
      "UPDATE coupons SET used_count = used_count + 1 WHERE code = $1",
      [couponCode.toUpperCase()]
    );
  }

  return { subscriptionId: sub?.id, invoiceNumber, periodEnd };
}

// ── Validate Coupon ──────────────────────────────────────────────────────────
export async function validateCoupon(code: string): Promise<{
  valid: boolean;
  discountPercent: number;
  message: string;
}> {
  const coupon = await queryOne<{
    id: string;
    code: string;
    discount_percent: number;
    max_uses: number;
    used_count: number;
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
  }>(
    "SELECT * FROM coupons WHERE code = $1",
    [code.toUpperCase().trim()]
  );

  if (!coupon) {
    return { valid: false, discountPercent: 0, message: "Invalid coupon code." };
  }
  if (!coupon.is_active) {
    return { valid: false, discountPercent: 0, message: "This coupon has been deactivated." };
  }
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return { valid: false, discountPercent: 0, message: "This coupon has reached its usage limit." };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { valid: false, discountPercent: 0, message: "This coupon has expired." };
  }

  return {
    valid: true,
    discountPercent: coupon.discount_percent,
    message: `${coupon.discount_percent}% discount applied!`,
  };
}

// ── Get Admin Notification Email ─────────────────────────────────────────────
export async function getAdminEmail(): Promise<string> {
  const setting = await queryOne<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'admin_notification_email'"
  );
  return setting?.value || process.env.ADMIN_NOTIFICATION_EMAIL || "ankmuz007@gmail.com";
}
