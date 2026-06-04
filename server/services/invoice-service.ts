/**
 * Invoice & Email Service — Payment confirmations, invoices, expiry reminders
 */
import nodemailer from "nodemailer";
import { getAdminEmail } from "./payment-service";

// ── Transporter ──────────────────────────────────────────────────────────────
async function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS.replace(/\s+/g, ""),
      },
    });
  }
  // Fallback to Ethereal for dev
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

// ── HTML Email Wrapper ───────────────────────────────────────────────────────
function emailWrapper(title: string, body: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #1a1a1a;">
      <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6, #f97316); padding: 32px 24px; text-align: center;">
        <h1 style="color: #fff; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">CASTHUB</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 8px 0 0; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">${title}</p>
      </div>
      <div style="padding: 32px 24px; color: #d4d4d4; font-size: 14px; line-height: 1.7;">
        ${body}
      </div>
      <div style="padding: 20px 24px; border-top: 1px solid #1a1a1a; text-align: center;">
        <p style="color: #666; font-size: 11px; margin: 0; font-weight: 600;">
          © ${new Date().getFullYear()} CastHub · Automated Outreach Platform
        </p>
      </div>
    </div>
  `;
}

// ── Format Amount ────────────────────────────────────────────────────────────
function formatAmount(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

// ── Generate Invoice HTML ────────────────────────────────────────────────────
export function generateInvoiceHTML(payment: {
  invoice_number: string;
  amount: number;
  discount_amount: number;
  method: string;
  coupon_code: string | null;
  created_at: string;
}, user: { name: string; email: string }, plan: string): string {
  const date = new Date(payment.created_at).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric"
  });
  const originalAmount = payment.amount + (payment.discount_amount || 0);

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #111; border-radius: 8px;">
        <td colspan="2" style="padding: 16px; border-bottom: 1px solid #222;">
          <p style="margin: 0; font-size: 18px; font-weight: 900; color: #fff;">INVOICE</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #888; font-weight: 700;">#${payment.invoice_number}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Date</td>
        <td style="padding: 12px 16px; color: #fff; font-size: 13px; font-weight: 600; text-align: right;">${date}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Plan</td>
        <td style="padding: 12px 16px; color: #ec4899; font-size: 13px; font-weight: 800; text-align: right; text-transform: uppercase;">${plan}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Payment Method</td>
        <td style="padding: 12px 16px; color: #fff; font-size: 13px; font-weight: 600; text-align: right; text-transform: uppercase;">${payment.method || "–"}</td>
      </tr>
      ${payment.coupon_code ? `
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Coupon Applied</td>
        <td style="padding: 12px 16px; color: #22c55e; font-size: 13px; font-weight: 800; text-align: right;">${payment.coupon_code}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Original Price</td>
        <td style="padding: 12px 16px; color: #666; font-size: 13px; font-weight: 600; text-align: right; text-decoration: line-through;">${formatAmount(originalAmount)}</td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; color: #888; font-size: 12px; font-weight: 700;">Discount</td>
        <td style="padding: 12px 16px; color: #22c55e; font-size: 13px; font-weight: 800; text-align: right;">-${formatAmount(payment.discount_amount)}</td>
      </tr>
      ` : ""}
      <tr style="border-top: 2px solid #333;">
        <td style="padding: 16px; color: #fff; font-size: 14px; font-weight: 900;">TOTAL PAID</td>
        <td style="padding: 16px; color: #ec4899; font-size: 20px; font-weight: 900; text-align: right;">${formatAmount(payment.amount)}</td>
      </tr>
    </table>
  `;
}

// ── Send Payment Confirmation to User ────────────────────────────────────────
export async function sendPaymentConfirmation(
  user: { name: string; email: string },
  payment: {
    invoice_number: string;
    amount: number;
    discount_amount: number;
    method: string;
    coupon_code: string | null;
    created_at: string;
  },
  plan: string,
  periodEnd: Date
) {
  try {
    const transporter = await getTransporter();
    const invoiceHtml = generateInvoiceHTML(payment, user, plan);
    const endDate = periodEnd.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

    const body = `
      <p style="color: #fff; font-size: 16px; font-weight: 700;">Hey ${user.name || "there"} 👋</p>
      <p>Your payment has been <strong style="color: #22c55e;">successfully processed</strong>! You now have full access to CastHub.</p>
      ${invoiceHtml}
      <p style="margin-top: 16px; color: #888; font-size: 13px;">
        Your <strong style="color: #ec4899;">${plan}</strong> subscription is active until <strong style="color: #fff;">${endDate}</strong>.
      </p>
      <p style="margin-top: 24px;">
        <a href="${process.env.APP_URL || 'https://app.casthub.in'}/dashboard" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 13px; letter-spacing: 1px;">GO TO DASHBOARD →</a>
      </p>
    `;

    await transporter.sendMail({
      from: `"CastHub" <${process.env.SMTP_USER || "noreply@casthub.com"}>`,
      to: user.email,
      subject: `✅ Payment Confirmed — ${plan} Plan | CastHub`,
      html: emailWrapper("Payment Confirmation", body),
    });
    console.log(`[invoice] Payment confirmation sent to ${user.email}`);
  } catch (err) {
    console.error("[invoice] Failed to send payment confirmation:", err);
  }
}

// ── Notify Admin ─────────────────────────────────────────────────────────────
export async function notifyAdminPayment(
  user: { name: string; email: string },
  payment: {
    invoice_number: string;
    amount: number;
    method: string;
    created_at: string;
  },
  plan: string
) {
  try {
    const transporter = await getTransporter();
    const adminEmail = await getAdminEmail();
    const date = new Date(payment.created_at).toLocaleDateString("en-IN");

    const body = `
      <p style="color: #fff; font-size: 16px; font-weight: 700;">💰 New Payment Received!</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">User</td><td style="padding: 8px 0; color: #fff; font-weight: 600;">${user.name} (${user.email})</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">Plan</td><td style="padding: 8px 0; color: #ec4899; font-weight: 800; text-transform: uppercase;">${plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">Amount</td><td style="padding: 8px 0; color: #22c55e; font-weight: 900; font-size: 18px;">${formatAmount(payment.amount)}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">Method</td><td style="padding: 8px 0; color: #fff; text-transform: uppercase;">${payment.method}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">Invoice</td><td style="padding: 8px 0; color: #fff;">#${payment.invoice_number}</td></tr>
        <tr><td style="padding: 8px 0; color: #888; font-weight: 700; font-size: 12px;">Date</td><td style="padding: 8px 0; color: #fff;">${date}</td></tr>
      </table>
    `;

    await transporter.sendMail({
      from: `"CastHub System" <${process.env.SMTP_USER || "system@casthub.com"}>`,
      to: adminEmail,
      subject: `💰 Payment: ${formatAmount(payment.amount)} from ${user.name} | CastHub`,
      html: emailWrapper("Admin Payment Notification", body),
    });
    console.log(`[invoice] Admin notified at ${adminEmail}`);
  } catch (err) {
    console.error("[invoice] Failed to notify admin:", err);
  }
}

// ── Send Expiration Reminder ─────────────────────────────────────────────────
export async function sendExpirationReminder(
  user: { name: string; email: string },
  daysRemaining: number,
  planType: string
) {
  try {
    const transporter = await getTransporter();
    const urgency = daysRemaining <= 1 ? "🚨" : "⚠️";

    const body = `
      <p style="color: #fff; font-size: 16px; font-weight: 700;">Hey ${user.name || "there"} ${urgency}</p>
      <p>Your <strong style="color: #ec4899;">${planType === "trial" ? "free trial" : planType + " subscription"}</strong> expires in <strong style="color: #f97316; font-size: 20px;">${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</strong>.</p>
      <p style="color: #888; margin-top: 8px;">After expiration, you'll lose access to CastHub features including contacts, automation, and messaging.</p>
      <p style="margin-top: 24px;">
        <a href="${process.env.APP_URL || 'https://app.casthub.in'}/subscription" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 13px; letter-spacing: 1px;">${planType === "trial" ? "SUBSCRIBE NOW →" : "RENEW NOW →"}</a>
      </p>
    `;

    await transporter.sendMail({
      from: `"CastHub" <${process.env.SMTP_USER || "noreply@casthub.com"}>`,
      to: user.email,
      subject: `${urgency} ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left — ${planType === "trial" ? "Trial" : "Subscription"} Expiring | CastHub`,
      html: emailWrapper("Subscription Reminder", body),
    });
    console.log(`[invoice] Expiry reminder sent to ${user.email} (${daysRemaining} days left)`);
  } catch (err) {
    console.error("[invoice] Failed to send expiry reminder:", err);
  }
}
