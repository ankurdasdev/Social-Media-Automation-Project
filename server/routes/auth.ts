import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { query, queryOne } from "../db/index";
import { logUserAction } from "./admin";

const JWT_SECRET = process.env.JWT_SECRET || "casthub_dev_secret_change_in_production";
const JWT_EXPIRES_IN = "7d";
const VERIFY_SECRET = (process.env.JWT_SECRET || "casthub_dev_secret_change_in_production") + "_verify";
const RESET_SECRET = (process.env.JWT_SECRET || "casthub_dev_secret_change_in_production") + "_casthub_reset";

function signToken(payload: { userId: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ── Email transporter factory ──────────────────────────────────────────────────
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
}

// ── Branded verification email HTML ───────────────────────────────────────────
function buildVerificationEmail(name: string, verifyLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your CastHub account</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0533 0%,#0d1a3a 100%);border-radius:24px 24px 0 0;padding:40px 40px 32px;text-align:center;border:1px solid rgba(139,92,246,0.2);border-bottom:none;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:18px;margin-bottom:20px;">
                <span style="font-size:28px;">⚡</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:-0.5px;">CASTHUB</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Casting Automation Dashboard</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#111118;padding:40px;border:1px solid rgba(139,92,246,0.15);border-top:none;border-bottom:none;">
              <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:800;">Welcome, ${name}! 👋</h2>
              <p style="margin:0 0 24px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
                Thanks for signing up to CastHub. You're one step away from automating your casting outreach — across WhatsApp, Gmail, and Instagram.
              </p>
              <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
                Please verify your email address to activate your account:
              </p>
              <!-- CTA Button -->
              <div style="text-align:center;margin:0 0 36px;">
                <a href="${verifyLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;border-radius:14px;font-weight:900;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 8px 32px rgba(124,58,237,0.4);">
                  ✉️ &nbsp; Verify My Email
                </a>
              </div>
              <!-- Link fallback -->
              <p style="margin:0 0 32px;color:rgba(255,255,255,0.35);font-size:12px;text-align:center;word-break:break-all;">
                Or paste this link in your browser:<br/>
                <a href="${verifyLink}" style="color:#7c3aed;">${verifyLink}</a>
              </p>
              <!-- Features highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:0;overflow:hidden;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:800;">What you unlock with CastHub</p>
                    <table width="100%" cellpadding="0" cellspacing="8">
                      <tr>
                        <td width="50%" style="padding:10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15);border-radius:10px;">
                          <span style="font-size:18px;">💬</span>
                          <p style="margin:6px 0 0;color:#10b981;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">WhatsApp Automation</p>
                          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Mass outreach via WhatsApp</p>
                        </td>
                        <td width="4"></td>
                        <td width="50%" style="padding:10px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:10px;">
                          <span style="font-size:18px;">📧</span>
                          <p style="margin:6px 0 0;color:#3b82f6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Gmail Outreach</p>
                          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Personalized email campaigns</p>
                        </td>
                      </tr>
                      <tr><td height="8"></td></tr>
                      <tr>
                        <td width="50%" style="padding:10px;background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.15);border-radius:10px;">
                          <span style="font-size:18px;">📸</span>
                          <p style="margin:6px 0 0;color:#ec4899;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Instagram DMs</p>
                          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Reach talent on Instagram</p>
                        </td>
                        <td width="4"></td>
                        <td width="50%" style="padding:10px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:10px;">
                          <span style="font-size:18px;">📊</span>
                          <p style="margin:6px 0 0;color:#7c3aed;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Analytics & Tracking</p>
                          <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">Full campaign analytics</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0d0d14;border-radius:0 0 24px 24px;padding:28px 40px;border:1px solid rgba(139,92,246,0.15);border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 12px;color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;">
                This link expires in <strong style="color:rgba(255,255,255,0.4);">24 hours</strong>. If you didn't create a CastHub account, you can safely ignore this email.
              </p>
              <p style="margin:0 0 12px;color:rgba(255,255,255,0.15);font-size:10px;line-height:1.7;">
                By using CastHub, you agree to our <a href="#" style="color:#7c3aed;">Terms of Service</a> and <a href="#" style="color:#7c3aed;">Privacy Policy</a>. CastHub is a professional casting automation tool. Please ensure you comply with each platform's Terms of Service when sending automated messages. Misuse may result in account restrictions on third-party platforms.
              </p>
              <p style="margin:0;color:rgba(255,255,255,0.1);font-size:10px;">© 2025 CastHub. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
export const handleSignup: RequestHandler = async (req, res) => {
  const { name, email, password, gender, dob, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    // Check if email already taken
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Check if phone already taken (if provided)
    if (phone && phone.trim()) {
      const existingPhone = await queryOne<{ id: string }>(
        "SELECT id FROM users WHERE phone = $1",
        [phone.trim()]
      );
      if (existingPhone) {
        return res.status(409).json({ error: "An account with this phone number already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token (24h expiry)
    const verifyToken = jwt.sign({ email: email.toLowerCase().trim() }, VERIFY_SECRET, { expiresIn: "24h" });
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [user] = await query<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, name, gender, dob, phone, password_hash, email_verified, email_verify_token, email_verify_expires) 
       VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8) 
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), name.trim(), gender || null, dob || null, phone?.trim() || null, passwordHash, verifyToken, verifyExpires]
    );

    // Determine base URL
    let baseUrl = process.env.APP_URL;
    if (!baseUrl) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      baseUrl = `${protocol}://${host}`;
    }
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;

    // Send verification email
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: `"CastHub" <${process.env.SMTP_USER || "noreply@casthub.com"}>`,
        to: email,
        subject: "Verify your CastHub account ⚡",
        text: `Hi ${name.trim()},\n\nPlease verify your CastHub account by clicking this link:\n\n${verifyLink}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
        html: buildVerificationEmail(name.trim(), verifyLink),
      });

      if (!process.env.SMTP_USER) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[auth] 📧 Verification email preview: ${previewUrl}`);
      }
    } catch (emailErr) {
      console.error("[auth] Failed to send verification email:", emailErr);
      // Don't fail signup if email fails — user can resend
    }

    await logUserAction(user.id, "signup", "success");

    res.status(201).json({
      message: "Account created! Please check your email to verify your account before signing in.",
      email: user.email,
    });
  } catch (err: any) {
    console.error("[auth] Signup error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
};

// ── GET /api/auth/verify-email ─────────────────────────────────────────────────
export const handleVerifyEmail: RequestHandler = async (req, res) => {
  const { token } = req.query as { token: string };

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    const decoded = jwt.verify(token, VERIFY_SECRET) as { email: string };

    const user = await queryOne<{ id: string; email: string; name: string; email_verified: boolean }>(
      "SELECT id, email, name, email_verified FROM users WHERE email = $1 AND email_verify_token = $2",
      [decoded.email, token]
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid or already used verification link" });
    }

    if (user.email_verified) {
      // Already verified — just issue token
      const authToken = signToken({ userId: user.id, email: user.email, name: user.name });
      return res.json({ token: authToken, user: { id: user.id, email: user.email, name: user.name }, alreadyVerified: true });
    }

    // Mark verified, clear token
    await query(
      "UPDATE users SET email_verified = true, email_verify_token = NULL, email_verify_expires = NULL, updated_at = NOW() WHERE id = $1",
      [user.id]
    );

    await logUserAction(user.id, "email_verified", "success");

    const authToken = signToken({ userId: user.id, email: user.email, name: user.name });
    res.json({ token: authToken, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Verification link has expired. Please request a new one." });
    }
    console.error("[auth] Verify email error:", err);
    return res.status(401).json({ error: "Invalid verification link" });
  }
};

// ── POST /api/auth/resend-verification ────────────────────────────────────────
export const handleResendVerification: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await queryOne<{ id: string; email: string; name: string; email_verified: boolean }>(
      "SELECT id, email, name, email_verified FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!user) {
      // Don't leak which emails exist
      return res.json({ message: "If an account exists, a verification email has been sent." });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: "This email is already verified. Please sign in." });
    }

    // Generate new token
    const verifyToken = jwt.sign({ email: user.email }, VERIFY_SECRET, { expiresIn: "24h" });
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      "UPDATE users SET email_verify_token = $1, email_verify_expires = $2, updated_at = NOW() WHERE id = $3",
      [verifyToken, verifyExpires, user.id]
    );

    let baseUrl = process.env.APP_URL;
    if (!baseUrl) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      baseUrl = `${protocol}://${host}`;
    }
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const verifyLink = `${baseUrl}/verify-email?token=${verifyToken}`;

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"CastHub" <${process.env.SMTP_USER || "noreply@casthub.com"}>`,
      to: user.email,
      subject: "Verify your CastHub account ⚡",
      text: `Hi ${user.name},\n\nHere is your new verification link:\n\n${verifyLink}\n\nThis link expires in 24 hours.`,
      html: buildVerificationEmail(user.name, verifyLink),
    });

    if (!process.env.SMTP_USER) {
      console.log(`[auth] 📧 Resent verification email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    res.json({ message: "Verification email sent! Please check your inbox." });
  } catch (err: any) {
    console.error("[auth] Resend verification error:", err);
    res.status(500).json({ error: "Failed to send verification email" });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
export const handleLogin: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    // Accept email OR phone number in the "email" field
    const isPhone = /^\+?\d{7,15}$/.test(email.trim().replace(/\s/g, ""));
    
    const user = await queryOne<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      email_verified: boolean;
    }>(
      isPhone
        ? "SELECT id, email, name, password_hash, email_verified FROM users WHERE phone = $1"
        : "SELECT id, email, name, password_hash, email_verified FROM users WHERE email = $1",
      [isPhone ? email.trim().replace(/\s/g, "") : email.toLowerCase().trim()]
    );

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email/phone or password" });
    }

    // Block unverified users
    if (!user.email_verified) {
      return res.status(403).json({
        error: "Please verify your email address before signing in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    await logUserAction(user.id, "login", "success");

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    console.error("[auth] Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
export const handleMe: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
    };

    const user = await queryOne<{
      id: string; email: string; name: string; gender: string; dob: string;
      phone: string; is_admin: boolean; email_verified: boolean; onboarding_completed: boolean;
    }>(
      "SELECT id, email, name, gender, dob, phone, is_admin, email_verified, onboarding_completed FROM users WHERE id = $1",
      [payload.userId]
    );

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired, please log in again" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ── POST /api/auth/complete-onboarding ────────────────────────────────────────
export const handleCompleteOnboarding: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  try {
    await query("UPDATE users SET onboarding_completed = true, updated_at = NOW() WHERE id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update onboarding status" });
  }
};

// ── Helper: middleware to protect server-side routes ───────────────────────────
export function requireAuth(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2]
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const { userId, name, email, password, gender, dob, phone } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (name) { updates.push(`name = $${paramIndex++}`); values.push(name.trim()); }
    if (email) { updates.push(`email = $${paramIndex++}`); values.push(email.toLowerCase().trim()); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push(`password_hash = $${paramIndex++}`); values.push(hash);
    }
    if (gender !== undefined) { updates.push(`gender = $${paramIndex++}`); values.push(gender); }
    if (dob !== undefined) { updates.push(`dob = $${paramIndex++}`); values.push(dob); }
    if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone); }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedUser = await queryOne(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING id, email, name, gender, dob, phone`,
      values
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name
    });

    res.json({ user: updatedUser, token });
  } catch (err: any) {
    console.error("[auth] Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ── POST /api/auth/reset-password ───────────────────────────────────────────
export const handleResetPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await queryOne<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.json({ message: "If an account exists, a reset link has been sent." });
    }

    const token = jwt.sign({ userId: user.id }, RESET_SECRET, { expiresIn: "30m" });

    let baseUrl = process.env.APP_URL;
    if (!baseUrl) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      baseUrl = `${protocol}://${host}`;
    }
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"CastHub" <${process.env.SMTP_USER || "noreply@casthub.com"}>`,
      to: email,
      subject: "Reset Your Password - CastHub",
      text: `You requested a password reset. Click this link:\n\n${resetLink}\n\nExpires in 30 minutes.`,
      html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0f;color:#fff;border-radius:16px;">
        <h2 style="color:#7c3aed;">Reset Your Password</h2>
        <p>You requested a password reset for your CastHub account.</p>
        <a href="${resetLink}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;margin:16px 0;">Reset Password</a>
        <p style="color:rgba(255,255,255,0.4);font-size:12px;">Link expires in 30 minutes. If you didn't request this, ignore this email.</p>
      </div>`,
    });

    if (!process.env.SMTP_USER) {
      console.log(`[auth] 🔗 Reset Mail Preview: ${nodemailer.getTestMessageUrl(info)}`);
      return res.json({ message: `Dev mode: View email at: ${nodemailer.getTestMessageUrl(info)}` });
    }

    res.json({ message: "If an account exists, a reset link has been sent to your email." });
  } catch (err: any) {
    console.error("[auth] Reset password error:", err);
    res.status(500).json({ error: "Debug Error: " + String(err) });
  }
};

// ── POST /api/auth/reset-password/confirm ───────────────────────────────────
export const handleResetPasswordConfirm: RequestHandler = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const decoded = jwt.verify(token, RESET_SECRET) as { userId: string };
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const result = await query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id",
      [passwordHash, decoded.userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password has been successfully reset" });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Reset token has expired" });
    }
    console.error("[auth] Confirm password reset error:", err);
    return res.status(401).json({ error: "Invalid reset token" });
  }
};

// ── GET /api/auth/keywords ──────────────────────────────────────────────────
export const handleGetAIKeywords: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const row = await queryOne("SELECT ai_keywords FROM users WHERE id = $1", [userId]);
    res.json({ keywords: row?.ai_keywords || [] });
  } catch (err: any) {
    console.error("[auth] Get keywords error:", err);
    res.status(500).json({ error: "Failed to get keywords" });
  }
};

// ── PUT /api/auth/keywords ──────────────────────────────────────────────────
export const handleUpdateAIKeywords: RequestHandler = async (req, res) => {
  const userId = req.body.userId;
  const keywords = req.body.keywords;
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    await query("UPDATE users SET ai_keywords = $1::jsonb WHERE id = $2", [JSON.stringify(keywords || []), userId]);
    res.json({ keywords: keywords || [] });
  } catch (err: any) {
    console.error("[auth] Update keywords error:", err);
    res.status(500).json({ error: "Failed to update keywords" });
  }
};

// ── DELETE /api/auth/delete-account ───────────────────────────────────────────
export const handleDeleteAccount: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  const queryUserId = req.query.userId as string;
  const targetUserId = userId || queryUserId;

  if (!targetUserId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (payload.userId !== targetUserId) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to delete this account" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid token" });
  }

  try {
    const deleted = await queryOne(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [targetUserId]
    );

    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Account successfully deleted." });
  } catch (err: any) {
    console.error("[auth] Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
