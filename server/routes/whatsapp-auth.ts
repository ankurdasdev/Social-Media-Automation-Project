import { RequestHandler } from "express";
import axios from "axios";
import { WhatsAppStatusResponse, WhatsAppQRResponse } from "@shared/api";
import { pool } from "../db/index";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const getHeaders = () => ({
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
});

function getUserId(req: Parameters<RequestHandler>[0]): string | null {
  return (
    (req.query.userId as string) ||
    (req.body?.userId as string) ||
    process.env.DEFAULT_USER_ID ||
    null
  );
}

/**
 * GET /api/whatsapp/status
 */
export const handleWhatsAppStatus: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const dbRes = await pool.query(
      "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
      [userId]
    );

    if (dbRes.rows.length === 0) {
      return res.json({ instance: null, isConnected: false });
    }

    const instanceName = dbRes.rows[0].instance_name;

    try {
      const evolutionRes = await axios.get(
        `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
        { headers: getHeaders() }
      );
      const status = evolutionRes.data.instance.state;
      return res.json({
        instance: { instanceName, status, isPaused: false },
        isConnected: status === "open",
      });
    } catch (apiErr: any) {
      if (apiErr.response?.status === 404) {
        return res.json({ instance: null, isConnected: false });
      }
      throw apiErr;
    }
  } catch (err: any) {
    console.error("WhatsApp Status Error:", err.message);
    res.status(500).json({ error: "Failed to fetch WhatsApp status" });
  }
};

/**
 * POST /api/whatsapp/connect
 */
export const handleWhatsAppConnect: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const { mobileNumber } = req.body as { mobileNumber?: string };

    const cleanNumber = mobileNumber?.replace(/\+/g, "").trim();
    const instanceName = cleanNumber ? `Evolution_${cleanNumber}` : "Evolution1";

    // Create instance with required integration field for Evolution API v2
    try {
      await axios.post(
        `${EVOLUTION_API_URL}/instance/create`,
        { 
          instanceName, 
          qrcode: true,
          integration: "WHATSAPP-BAILEYS" // Required for Evolution API v2
        },
        { headers: getHeaders() }
      );
    } catch (createErr: any) {
      // 403 = already exists, 400 with "already exists" message = also OK, anything else throw
      const isAlreadyExists = 
        createErr.response?.status === 403 ||
        (createErr.response?.status === 400 && 
         JSON.stringify(createErr.response?.data || "").toLowerCase().includes("already"));
      if (!isAlreadyExists) throw createErr;
    }

    // Store/Update the instance name for this user
    await pool.query(
      `INSERT INTO whatsapp_instances (user_id, instance_name) 
       VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET instance_name = $2, updated_at = NOW()`,
      [userId, instanceName]
    );

    // Retrieve QR code for the instance
    // Evolution API v2 returns: { base64: "data:image/png...", code: "...", count: N }
    // NOT { qrcode: { base64: ... } } — that was v1 format
    const qrRes = await axios.get(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: getHeaders() }
    );
    
    // Normalize to consistent shape for the client
    const base64 = qrRes.data?.base64 || qrRes.data?.qrcode?.base64;
    if (!base64) {
      console.error("[whatsapp] QR base64 missing from response:", JSON.stringify(Object.keys(qrRes.data || {})));
    }
    res.json({ qrcode: { base64, code: qrRes.data?.code, count: qrRes.data?.count } });
  } catch (err: any) {
    console.error("WhatsApp Connect Error:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to connect WhatsApp",
      details: err.response?.data || err.message
    });
  }
};

/**
 * GET /api/whatsapp/qr
 */
export const handleWhatsAppQR: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const dbRes = await pool.query(
      "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
      [userId]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: "Instance not found" });
    }

    const instanceName = dbRes.rows[0].instance_name;
    const qrRes = await axios.get(
      `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
      { headers: getHeaders() }
    );
    // Normalize v2 response shape
    const base64 = qrRes.data?.base64 || qrRes.data?.qrcode?.base64;
    res.json({ qrcode: { base64, code: qrRes.data?.code, count: qrRes.data?.count } });
  } catch (err: any) {
    console.error("WhatsApp QR Error:", err.message);
    res.status(500).json({ error: "Failed to fetch QR code" });
  }
};

/**
 * DELETE /api/whatsapp/disconnect
 */
export const handleWhatsAppDisconnect: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const dbRes = await pool.query(
      "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
      [userId]
    );

    if (dbRes.rows.length > 0) {
      const instanceName = dbRes.rows[0].instance_name;
      try {
        await axios.delete(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, { headers: getHeaders() });
        await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers: getHeaders() });
      } catch (e) {
        console.warn("Evolution Disconnect issue:", (e as Error).message);
      }
      await pool.query("DELETE FROM whatsapp_instances WHERE user_id = $1", [userId]);
    }
    res.json({ message: "WhatsApp disconnected" });
  } catch (err: any) {
    console.error("WhatsApp Disconnect Error:", err.message);
    res.status(500).json({ error: "Failed to disconnect WhatsApp" });
  }
};

/**
 * POST /api/whatsapp/sync-groups
 */
export const handleWhatsAppSyncGroups: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const dbRes = await pool.query(
      "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
      [userId]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: "WhatsApp instance not connected" });
    }

    const instanceName = dbRes.rows[0].instance_name;

    // Fetch groups from Evolution API v2 — correct endpoint is /group/fetchAllGroups/
    let groupsData: any[] = [];
    try {
      const groupsRes = await axios.get(
        `${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`,
        { headers: getHeaders() }
      );
      // Response is a plain array
      groupsData = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      console.log(`[whatsapp] Fetched ${groupsData.length} groups from Evolution API`);
    } catch (groupErr: any) {
      const detail = groupErr.response?.data || groupErr.message;
      console.error("[whatsapp] Could not fetch groups:", detail);
      return res.status(500).json({ 
        error: "Failed to fetch groups from WhatsApp. Make sure your account is connected and try again.",
        detail 
      });
    }

    // Evolution API returns: [ { id: "123@g.us", subject: "GroupName", ... }, ... ]
    let addedCount = 0;
    let updatedCount = 0;

    for (const group of groupsData) {
      if (!group.id || !group.subject) continue;

      // Check if this source name already exists for this user on whatsapp platform
      const existing = await pool.query(
        "SELECT id, url FROM source_groups WHERE user_id = $1 AND name = $2 AND platform = 'whatsapp'",
        [userId, group.subject]
      );

      if (existing.rows.length > 0) {
        // Update URL (JID) if it's missing or changed
        if (existing.rows[0].url !== group.id) {
          await pool.query(
            "UPDATE source_groups SET url = $1, updated_at = NOW() WHERE id = $2",
            [group.id, existing.rows[0].id]
          );
          updatedCount++;
        }
      } else {
        // Upsert into source_groups
        await pool.query(
          `INSERT INTO source_groups (user_id, name, platform, type, url, enabled)
           VALUES ($1, $2, 'whatsapp', 'group', $3, true)
           ON CONFLICT (user_id, name, platform) DO UPDATE SET 
             url = EXCLUDED.url,
             updated_at = NOW()`,
          [userId, group.subject, group.id]
        );
        addedCount++;
      }
    }

    res.json({ 
      message: `Sync complete. Added ${addedCount} new groups, updated ${updatedCount} existing sources.`,
      count: addedCount + updatedCount 
    });
  } catch (err: any) {
    console.error("WhatsApp Sync Groups Error:", err.message);
    res.status(500).json({ error: "Failed to sync WhatsApp groups", detail: err.message });
  }
};

/**
 * POST /api/whatsapp/send-message
 * Send a WhatsApp message to a phone number or group via Evolution API.
 */
export const handleWhatsAppSendMessage: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ error: "userId is required" });
    
    const { to, message, isGroup } = req.body as { 
      to: string;        // phone number (e.g. "919876543210") or group JID (e.g. "123456@g.us")
      message: string;
      isGroup?: boolean;
    };

    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }

    const dbRes = await pool.query(
      "SELECT instance_name FROM whatsapp_instances WHERE user_id = $1",
      [userId]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: "WhatsApp not connected. Please connect first." });
    }

    const instanceName = dbRes.rows[0].instance_name;

    // Determine JID: groups already have @g.us suffix, numbers need @s.whatsapp.net
    let jid: string;
    if (to.includes("@g.us") || to.includes("@s.whatsapp.net")) {
      jid = to;
    } else if (isGroup) {
      jid = `${to.replace(/[^0-9]/g, "")}@g.us`;
    } else {
      jid = `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    }

    const sendRes = await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        number: jid,
        text: message,
      },
      { headers: getHeaders() }
    );

    res.json({ success: true, messageId: sendRes.data?.key?.id, data: sendRes.data });
  } catch (err: any) {
    console.error("WhatsApp Send Error:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to send WhatsApp message",
      details: err.response?.data || err.message
    });
  }
};
