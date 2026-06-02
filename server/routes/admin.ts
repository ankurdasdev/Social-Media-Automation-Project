import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import os from "os";
import { query, queryOne } from "../db/index";
import nodemailer from "nodemailer";

const JWT_SECRET = process.env.JWT_SECRET || "casthub_dev_secret_change_in_production";
const RESET_SECRET = process.env.JWT_SECRET + "_casthub_reset";

// Middleware to ensure the user is an admin
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Check DB if user is admin
    const user = await queryOne<{ is_admin: boolean; is_active: boolean }>(
      "SELECT is_admin, is_active FROM users WHERE id = $1",
      [payload.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User inactive or not found" });
    }
    if (!user.is_admin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ── Utility: Log User Action ───────────────────────────────────────────────
export async function logUserAction(userId: string, action: string, status: "success" | "failure", details?: any) {
  try {
    await query(
      "INSERT INTO user_logs (user_id, action, status, details) VALUES ($1, $2, $3, $4)",
      [userId, action, status, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error("Failed to log user action:", err);
  }
}

// ── GET /api/admin/users ───────────────────────────────────────────────────
export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    // Get all users with some basic stats (e.g., total contacts)
    const users = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.name, 
        u.is_active, 
        u.is_admin, 
        u.created_at,
        (SELECT COUNT(*) FROM contacts WHERE user_id = u.id) as total_contacts
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    console.error("[admin] Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ── PATCH /api/admin/users/:id ─────────────────────────────────────────────
export const handleUpdateUser: RequestHandler = async (req, res) => {
  const targetId = req.params.id;
  const { is_active, is_admin, name, email } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [targetId];
    let paramIndex = 2;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    if (is_admin !== undefined) {
      updates.push(`is_admin = $${paramIndex++}`);
      values.push(is_admin);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email.toLowerCase().trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedUser = await queryOne(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING id, email, name, is_active, is_admin`,
      values
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await logUserAction((req as any).userId, "admin_update_user", "success", { targetUserId: targetId, updates: req.body });
    res.json({ user: updatedUser });
  } catch (err) {
    console.error("[admin] Update user error:", err);
    await logUserAction((req as any).userId, "admin_update_user", "failure", { targetUserId: targetId, error: String(err) });
    res.status(500).json({ error: "Failed to update user" });
  }
};

// ── POST /api/admin/users/:id/reset-password ───────────────────────────────
export const handleAdminResetPassword: RequestHandler = async (req, res) => {
  const targetId = req.params.id;
  try {
    const user = await queryOne<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE id = $1", 
      [targetId]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign({ userId: user.id }, RESET_SECRET, { expiresIn: "30m" });

    let baseUrl = process.env.APP_URL;
    if (!baseUrl) {
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("x-forwarded-host") || req.get("host");
      baseUrl = `${protocol}://${host}`;
    }
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS.replace(/\s+/g, ""),
        },
      });
    } else {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: `"CastHub Admin" <${process.env.SMTP_USER || 'admin@casthub.com'}>`,
      to: user.email,
      subject: "Admin Password Reset - CastHub",
      text: `An administrator has requested a password reset for your account. Click this link to create a new password:\n\n${resetLink}\n\nThis link expires in 30 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Admin Password Reset</h2>
          <p>An administrator has requested a password reset for your CastHub account.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eaeaea; padding-top: 16px;">
            The link will expire in 30 minutes.
          </p>
        </div>
      `,
    });

    await logUserAction((req as any).userId, "admin_trigger_password_reset", "success", { targetUserId: targetId });

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      res.json({ message: "Reset link has been sent to the user's email." });
    } else {
       const previewUrl = nodemailer.getTestMessageUrl(info);
       res.json({ message: `Dev mode: View reset email here: ${previewUrl}` });
    }
  } catch (err) {
    console.error("[admin] Reset password error:", err);
    await logUserAction((req as any).userId, "admin_trigger_password_reset", "failure", { targetUserId: targetId, error: String(err) });
    res.status(500).json({ error: "Failed to trigger reset password" });
  }
};

// ── GET /api/admin/analytics ───────────────────────────────────────────────
export const handleGetAnalytics: RequestHandler = async (req, res) => {
  try {
    // OS Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    
    const uptime = os.uptime(); // seconds
    const cpus = os.cpus();
    // Calculate CPU usage (rough estimation from tick times)
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsagePercent = 100 - ~~(100 * totalIdle / totalTick);

    // Business Metrics
    const totalUsersResult = await queryOne("SELECT COUNT(*) as count FROM users");
    const activeUsersResult = await queryOne("SELECT COUNT(*) as count FROM users WHERE is_active = true");
    const todayErrorsResult = await queryOne("SELECT COUNT(*) as count FROM user_logs WHERE status = 'failure' AND created_at >= NOW() - INTERVAL '24 HOURS'");

    res.json({
      server: {
        cpuUsagePercent,
        memUsagePercent,
        uptime,
      },
      business: {
        totalUsers: parseInt(totalUsersResult?.count || "0"),
        activeUsers: parseInt(activeUsersResult?.count || "0"),
        todayErrors: parseInt(todayErrorsResult?.count || "0"),
      }
    });
  } catch (err) {
    console.error("[admin] Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// ── GET /api/admin/logs ────────────────────────────────────────────────────
export const handleGetLogs: RequestHandler = async (req, res) => {
  try {
    const { userId, status, days = "30" } = req.query;
    let sql = `
      SELECT l.id, l.user_id, u.email as user_email, l.action, l.status, l.details, l.created_at
      FROM user_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.created_at >= NOW() - INTERVAL '${parseInt(days as string)} DAYS'
    `;
    const values: any[] = [];
    let paramIdx = 1;

    if (userId) {
      sql += ` AND l.user_id = $${paramIdx++}`;
      values.push(userId);
    }
    if (status) {
      sql += ` AND l.status = $${paramIdx++}`;
      values.push(status);
    }

    sql += " ORDER BY l.created_at DESC LIMIT 1000";

    const logs = await query(sql, values);
    res.json({ logs });
  } catch (err) {
    console.error("[admin] Logs error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
