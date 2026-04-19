/**
 * Instagram Auth via instagrapi-rest (Python service)
 *
 * Multi-user architecture:
 * - Each user provides their own Instagram username/password
 * - We login via the instagrapi-rest API and receive session settings JSON
 * - Session (not password) is stored encrypted per-user in instagram_sessions table
 * - Every API call restores the session first, makes the call, saves the updated session
 */
import { RequestHandler } from "express";
import { query, queryOne } from "../db";
import * as igClient from "../services/instagram-client";

// ─── Status ───────────────────────────────────────────────────────────────────

/**
 * GET /api/instagram/status?userId=xxx
 */
export const handleInstagramStatus: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const session = await queryOne<{
      username: string;
      status: string;
      connected_at: string;
      session_data: string;
    }>(
      "SELECT username, status, connected_at, session_data FROM instagram_sessions WHERE user_id = $1",
      [userId]
    );

    if (!session || session.status !== "connected" || !session.session_data) {
      return res.json({
        isConnected: false,
        username: null,
        connectedAt: null,
        serviceReachable: await igClient.isReachable(),
      });
    }

    res.json({
      isConnected: true,
      username: session.username,
      connectedAt: session.connected_at,
      serviceReachable: true,
    });
  } catch (err) {
    console.error("[instagram] Status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Connect (Login) ──────────────────────────────────────────────────────────

/**
 * POST /api/instagram/connect
 * Body: { userId, username, password, verificationCode? }
 *
 * Calls instagrapi-rest to login, stores session data per user.
 * Never stores the plain password — only the session JSON.
 */
export const handleInstagramConnect: RequestHandler = async (req, res) => {
  const { userId, username, password, verificationCode } = req.body as {
    userId: string;
    username: string;
    password: string;
    verificationCode?: string;
  };

  if (!userId || !username || !password) {
    return res.status(400).json({ error: "userId, username, and password are required" });
  }

  try {
    // Check instagrapi-rest is reachable first
    const reachable = await igClient.isReachable();
    if (!reachable) {
      return res.status(503).json({
        error: "Instagram service is offline. Please try again later.",
        twoFactorRequired: false,
      });
    }

    const result = await igClient.login(username, password, verificationCode);

    if (!result.success) {
      // Detect 2FA requirement
      const isTwoFactor =
        result.two_factor_required ||
        result.twoFactorRequired ||
        JSON.stringify(result).toLowerCase().includes("two_factor");

      return res.status(401).json({
        success: false,
        twoFactorRequired: isTwoFactor,
        message: result.detail || result.message || "Login failed",
        twoFactorInfo: result.two_factor_info,
      });
    }

    // Store session (not password) in DB
    await query(
      `INSERT INTO instagram_sessions (user_id, username, session_data, status, connected_at)
       VALUES ($1, $2, $3, 'connected', NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         username    = EXCLUDED.username,
         session_data = EXCLUDED.session_data,
         status      = 'connected',
         connected_at = NOW(),
         updated_at  = NOW()`,
      [userId, username.toLowerCase().trim(), result.session]
    );

    console.log(`[instagram] ✅ User ${userId} connected as @${username}`);
    res.json({ success: true, username });
  } catch (err: any) {
    console.error("[instagram] Connect error:", err.message);
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
};

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * DELETE /api/instagram/disconnect?userId=xxx
 */
export const handleInstagramDisconnect: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    await query(
      "UPDATE instagram_sessions SET session_data = NULL, status = 'disconnected', updated_at = NOW() WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[instagram] Disconnect error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── DM Threads (Source Groups) ────────────────────────────────────────────────

/**
 * GET /api/instagram/threads?userId=xxx
 * Fetch DM group/inbox threads and upsert into source_groups.
 */
export const handleInstagramSyncThreads: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const session = await queryOne<{ session_data: string }>(
      "SELECT session_data FROM instagram_sessions WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );

    if (!session?.session_data) {
      return res.status(401).json({ error: "Instagram not connected" });
    }

    // Fetch inbox threads via instagrapi-rest
    const BASE_URL = process.env.INSTAGRAPI_API_URL || "http://localhost:8000";
    const API_KEY = process.env.INSTAGRAPI_API_KEY || "";

    const threadRes = await fetch(`${BASE_URL}/v1/direct/threads`, {
      method: "POST",
      headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: JSON.parse(session.session_data),
        amount: 50,
      }),
    });

    if (!threadRes.ok) {
      const txt = await threadRes.text();
      console.error("[instagram] Thread fetch failed:", txt);
      return res.status(500).json({ error: "Failed to fetch Instagram threads" });
    }

    const threads: any[] = await threadRes.json();
    let addedCount = 0;

    for (const t of threads) {
      if (!t.id) continue;
      const name = t.thread_title || t.users?.[0]?.username || t.id;
      await query(
        `INSERT INTO source_groups (user_id, name, platform, type, url, enabled)
         VALUES ($1, $2, 'instagram', 'group', $3, true)
         ON CONFLICT (user_id, name, platform) DO UPDATE SET
           url = EXCLUDED.url,
           updated_at = NOW()`,
        [userId, name, t.id]
      );
      addedCount++;
    }

    res.json({ message: `Synced ${addedCount} Instagram threads`, count: addedCount });
  } catch (err: any) {
    console.error("[instagram] Sync threads error:", err.message);
    res.status(500).json({ error: "Failed to sync Instagram threads" });
  }
};

// ─── Send DM ──────────────────────────────────────────────────────────────────

/**
 * POST /api/instagram/send-message
 * Body: { userId, usernames: string[], text: string }
 */
export const handleInstagramSendMessage: RequestHandler = async (req, res) => {
  const { userId, usernames, text } = req.body as {
    userId: string;
    usernames: string[];
    text: string;
  };

  if (!userId || !usernames?.length || !text) {
    return res.status(400).json({ error: "userId, usernames[], and text are required" });
  }

  try {
    const session = await queryOne<{ session_data: string }>(
      "SELECT session_data FROM instagram_sessions WHERE user_id = $1 AND status = 'connected'",
      [userId]
    );

    if (!session?.session_data) {
      return res.status(401).json({ error: "Instagram not connected" });
    }

    await igClient.sendDirectMessage(usernames, text, session.session_data);
    res.json({ success: true });
  } catch (err: any) {
    console.error("[instagram] Send DM error:", err.message);
    res.status(500).json({ error: "Failed to send Instagram message", detail: err.message });
  }
};
