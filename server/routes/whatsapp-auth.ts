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
    const instanceName = mobileNumber ? `wa_${mobileNumber}` : "Evolution1"; // Dynamic instance name

      // Ensure the instance exists – ignore 403 if already created
      try {
        await axios.post(
          `${EVOLUTION_API_URL}/instance/create`,
          { instanceName, qrcode: true },
          { headers: getHeaders() }
        );
      } catch (createErr: any) {
        if (createErr.response?.status !== 403) throw createErr;
      }

      // Store/Update the instance name for this user
      await pool.query(
        `INSERT INTO whatsapp_instances (user_id, instance_name) 
         VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET instance_name = $2, updated_at = NOW()`,
        [userId, instanceName]
      );

      // Retrieve QR code for the instance
      const qrRes = await axios.get(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        { headers: getHeaders() }
      );
      res.json(qrRes.data);
    } catch (err: any) {
      console.error("WhatsApp Connect Error:", err.message);
      res.status(500).json({ error: "Failed to connect WhatsApp" });
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
    res.json(qrRes.data);
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
