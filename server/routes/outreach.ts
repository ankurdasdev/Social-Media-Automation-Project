import { RequestHandler } from "express";
import { sendOutreach } from "../services/outreach-service";
import { logUserAction } from "./admin";

/**
 * Outreach API Routes
 * 
 * 
 * ── POST /api/outreach/send ──────────────────────────────────────────────────
 */

export const handleSendOutreach: RequestHandler = async (req, res) => {
  const { contactId, userId, channel, channels } = req.body;

  const activeChannels = channels || (channel ? [channel] : []);

  if (!contactId || !userId || activeChannels.length === 0) {
    return res.status(400).json({ error: "contactId, userId, and at least one channel are required" });
  }

  try {
    const result = await sendOutreach({ ...req.body, channels: activeChannels });
    // Note: Outreach successes are typically handled within the service to be granular per platform.
    // We log the top level request here if successful.
    await logUserAction(userId, "outreach", "success", { contactId, channels: activeChannels });
    res.json(result);
  } catch (err: any) {
    console.error(`[outreach] Error sending outreach channels [${activeChannels.join(", ")}]:`, err);
    await logUserAction(userId, "outreach", "failure", { contactId, channels: activeChannels, error: String(err) });
    res.status(500).json({ error: err.message || "Outreach failed" });
  }
};
