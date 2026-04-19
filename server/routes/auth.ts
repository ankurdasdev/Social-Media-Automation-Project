import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { query, queryOne } from "../db/index";

const JWT_SECRET = process.env.JWT_SECRET || "casthub_dev_secret_change_in_production";
const JWT_EXPIRES_IN = "7d";

function signToken(payload: { userId: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
export const handleSignup: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await query<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, name, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, name`,
      [email.toLowerCase().trim(), name.trim(), passwordHash]
    );

    const token = signToken({ userId: user.id, email: user.email, name: user.name });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    console.error("[auth] Signup error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
export const handleLogin: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const user = await queryOne<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
    }>(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!user || !user.password_hash) {
      // Use generic message to avoid leaking which emails are registered
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name });

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
// Verifies the JWT and returns the current user profile
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

    const user = await queryOne<{ id: string; email: string; name: string }>(
      "SELECT id, email, name FROM users WHERE id = $1",
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

// ── Helper: middleware to protect server-side routes (optional future use) ─────
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
  const { userId, name, email, password } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const updates: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase().trim());
    }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedUser = await queryOne(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING id, email, name`,
      values
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User found" });
    }

    // Generate a fresh token with updated info (name/email)
    const token = signToken({ 
      userId: updatedUser.id, 
      email: updatedUser.email, 
      name: updatedUser.name 
    });

    res.json({ 
      user: updatedUser,
      token 
    });
  } catch (err: any) {
    console.error("[auth] Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const RESET_SECRET = process.env.JWT_SECRET + "_casthub_reset";

// ── POST /api/auth/reset-password ───────────────────────────────
export const handleResetPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;
  console.log(`🛠️ [DEBUG] Reset password handler called for email: ${email}`);
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await queryOne<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE email = $1", 
      [email.toLowerCase().trim()]
    );

    if (!user) {
      // Do not leak whether the email exists
      return res.json({ message: "If an account exists, a reset link has been sent." });
    }

    // Generate a secure, time-limited reset token using JWT
    const token = jwt.sign({ userId: user.id }, RESET_SECRET, { expiresIn: "30m" });

    // Determine base URL from request origin to construct a valid reset link
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.get("host") || "localhost:8080";
    const baseUrl = `${protocol}://${host}`;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    console.log(`[auth] Password reset requested for: ${email}`);
    
    // Setup Nodemailer: use env SMTP or fallback to Ethereal free testing service
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to Ethereal Email (Development ONLY - does NOT send real emails)
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    // Send the email
    const info = await transporter.sendMail({
      from: '"CastHub Security" <noreply@casthub.com>',
      to: email,
      subject: "Reset Your Password - CastHub",
      text: `You requested a password reset. Click this link to create a new password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You requested a password reset for your CastHub account.</p>
          <p>Click the button below to create a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #0066cc;">${resetLink}</a></p>
          <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 16px;">
            If you didn't request a password reset, you can safely ignore this email. The link will expire in 30 minutes.
          </p>
        </div>
      `,
    });

    if (!process.env.SMTP_HOST) {
       // Using Ethereal: grab the preview URL to show the user
       const previewUrl = nodemailer.getTestMessageUrl(info);
       console.log(`[auth] 🔗 Reset Mail Preview: ${previewUrl}`);
       
       // Return the preview URL in the message so they can click it right from the toast in dev mode!
       res.json({ message: `Success! View your reset email here: ${previewUrl}` });
    } else {
       res.json({ message: "If an account exists, a reset link has been sent." });
    }
  } catch (err: any) {
    console.error("[auth] Reset password error:", err);
    res.status(500).json({ error: "Debug Error: " + String(err) + " | " + (err.stack ? err.stack : "") });
  }
};

// ── POST /api/auth/reset-password/confirm ───────────────────────
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
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password
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
