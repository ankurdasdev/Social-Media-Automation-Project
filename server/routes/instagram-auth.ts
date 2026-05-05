/**
 * Instagram Auth via instagrapi-rest (Python service)
 *
 * Multi-user architecture:
 * - Each user provides their own Instagram username/password
 * - Login is performed DIRECTLY from the user's browser → instagrapi-rest
 *   so that the network request uses the user's residential IP (not the server IP).
 * - Session (not password) is stored per-user in instagram_sessions table.
 */
import { RequestHandler } from "express";
import { query, queryOne } from "../db";
import * as igClient from "../services/instagram-client";

// ─── Service Config ───────────────────────────────────────────────────────────

/**
 * GET /api/instagram/service-config
 * Returns the instagrapi-rest base URL + API key so the frontend can call it
 * directly from the user's browser (uses their residential IP, not server IP).
 */
export const handleInstagramServiceConfig: RequestHandler = (_req, res) => {
  const baseUrl = process.env.INSTAGRAPI_API_URL || "http://localhost:8000";
  const apiKey = process.env.INSTAGRAPI_API_KEY || "";
  res.json({ baseUrl, apiKey });
};


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
      const errorStr = typeof result.error === 'object' ? JSON.stringify(result.error) : String(result.error || "");
      const isTwoFactor = errorStr.toLowerCase().includes("two_factor") || errorStr.toLowerCase().includes("verification_code");

      return res.status(401).json({
        success: false,
        twoFactorRequired: isTwoFactor,
        message: errorStr || "Login failed",
      });
    }

    // Store session (not password) in DB
    const sessionData = typeof result.session === 'string' ? result.session : JSON.stringify(result.session);
    await query(
      `INSERT INTO instagram_sessions (user_id, username, session_data, status, connected_at)
       VALUES ($1, $2, $3, 'connected', NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         username    = EXCLUDED.username,
         session_data = EXCLUDED.session_data,
         status      = 'connected',
         connected_at = NOW(),
         updated_at  = NOW()`,
      [userId, username.toLowerCase().trim(), sessionData]
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

// ─── Connect via Session Cookie ───────────────────────────────────────────────

/**
 * POST /api/instagram/connect-session
 * Body: { userId, username, sessionId }
 *
 * Allows connecting via the raw sessionid cookie instead of password.
 * This is the most reliable method when the server IP is blocked by Instagram.
 */
export const handleInstagramConnectSession: RequestHandler = async (req, res) => {
  const { userId, username, sessionId } = req.body as {
    userId: string;
    username: string;
    sessionId: string;
  };

  if (!userId || !username || !sessionId) {
    return res.status(400).json({ error: "userId, username, and sessionId are required" });
  }

  // The sessionId IS the session data we need for instagrapi-rest
  const sessionData = sessionId.trim();

  try {
    // Verify the session works by making a simple API call
    const BASE_URL = process.env.INSTAGRAPI_API_URL || "http://localhost:8000";
    const API_KEY = process.env.INSTAGRAPI_API_KEY || "";

    const form = new URLSearchParams();
    form.append("sessionid", sessionData);
    
    let verifiedUsername = username.toLowerCase().trim();
    
    // Try to verify the session by fetching account info
    try {
      const verifyRes = await fetch(`${BASE_URL}/account/info`, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });

      if (verifyRes.ok) {
        const info = await verifyRes.json();
        if (info?.username) verifiedUsername = info.username;
        console.log(`[instagram] Session verified for @${verifiedUsername}`);
      } else {
        const errText = await verifyRes.text();
        console.warn(`[instagram] Session verify returned ${verifyRes.status}: ${errText}`);
        // We still proceed — the session might work for DMs even if account/info fails
      }
    } catch (verifyErr: any) {
      console.warn("[instagram] Session verification request failed (non-fatal):", verifyErr.message);
    }

    // Store session in DB
    await query(
      `INSERT INTO instagram_sessions (user_id, username, session_data, status, connected_at)
       VALUES ($1, $2, $3, 'connected', NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         username    = EXCLUDED.username,
         session_data = EXCLUDED.session_data,
         status      = 'connected',
         connected_at = NOW(),
         updated_at  = NOW()`,
      [userId, verifiedUsername, sessionData]
    );

    console.log(`[instagram] ✅ Session cookie connected for @${verifiedUsername}`);
    res.json({ success: true, username: verifiedUsername });
  } catch (err: any) {
    console.error("[instagram] Connect session error:", err.message);
    res.status(500).json({ error: "Internal server error", detail: err.message });
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
      "SELECT session_data FROM instagram_sessions WHERE user_id = $1 ",
      [userId]
    );

    if (!session?.session_data) {
      return res.status(401).json({ error: "Instagram not connected" });
    }

    // Fetch inbox threads via instagrapi-rest
    const BASE_URL = process.env.INSTAGRAPI_API_URL || "http://localhost:8000";
    const API_KEY = process.env.INSTAGRAPI_API_KEY || "";

    const threadRes = await fetch(`${BASE_URL}/direct/threads`, {
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
      "SELECT session_data FROM instagram_sessions WHERE user_id = $1 ",
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
