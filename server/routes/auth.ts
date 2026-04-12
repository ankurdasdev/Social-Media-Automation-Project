import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
