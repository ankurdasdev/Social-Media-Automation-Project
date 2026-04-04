import { RequestHandler } from "express";
import { query, queryOne } from "../db";
import * as igClient from "../services/instagram-client";
import { InstagramStatusResponse, InstagramLoginResponse } from "@shared/api";

/**
 * GET /api/instagram/status
 * Check if the user has a valid Instagram session.
 */
export const handleInstagramStatus: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const session = await queryOne(
      "SELECT * FROM instagram_sessions WHERE user_id = $1",
      [userId]
    );

    if (!session || !session.session_data) {
      return res.json({ isConnected: false, username: null, connectedAt: null });
    }

    // Optionally check if the session is still valid by calling a lightweight IG endpoint
    // If it fails, we should update the status to 'disconnected'
    
    res.json({
      isConnected: session.status === "connected",
      username: session.username,
      connectedAt: session.connected_at,
    });
  } catch (err) {
    console.error("Failed to fetch Instagram status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/instagram/connect
 * Log in to Instagram and save the session.
 */
export const handleInstagramConnect: RequestHandler = async (req, res) => {
  const { userId, username, password, verificationCode } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ error: "userId and username are required" });
  }

  try {
    const result = await igClient.login(username, password, verificationCode);

    if (result.success && result.session) {
      // Upsert the session into the database
      await query(
        `INSERT INTO instagram_sessions (user_id, username, session_data, status, connected_at)
         VALUES ($1, $2, $3, 'connected', NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           username = EXCLUDED.username,
           session_data = EXCLUDED.session_data,
           status = 'connected',
           connected_at = NOW(),
           updated_at = NOW()`,
        [userId, username, result.session]
      );

      const response: InstagramLoginResponse = { success: true };
      return res.json(response);
    } else {
      const response: InstagramLoginResponse = {
        success: false,
        message: result.message || "Login failed",
        twoFactorRequired: result.two_factor_required,
        twoFactorInfo: result.two_factor_info,
      };
      return res.status(401).json(response);
    }
  } catch (err: any) {
    console.error("Instagram login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/instagram/disconnect
 * Clear the Instagram session.
 */
export const handleInstagramDisconnect: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    await query(
      "UPDATE instagram_sessions SET session_data = NULL, status = 'disconnected' WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to disconnect Instagram:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
