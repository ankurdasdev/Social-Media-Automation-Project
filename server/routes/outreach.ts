import { RequestHandler } from "express";
import { sendOutreach } from "../services/outreach-service";

/**
 * Outreach API Routes
 * 
 * 
 * ── POST /api/outreach/send ──────────────────────────────────────────────────
 */

export const handleSendOutreach: RequestHandler = async (req, res) => {
  const { contactId, userId, channel } = req.body;

  if (!contactId || !userId || !channel) {
    return res.status(400).json({ error: "contactId, userId, and channel are required" });
  }

  try {
    const result = await sendOutreach(req.body);
    res.json(result);
  } catch (err: any) {
    console.error(`[outreach] Error sending ${channel}:`, err);
    res.status(500).json({ error: err.message || "Outreach failed" });
  }
};
