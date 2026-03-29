/**
 * WhatsApp Evolution API Client
 *
 * Thin wrapper around the self-hosted Evolution API (Baileys-based).
 * Docs: https://github.com/EvolutionAPI/evolution-api
 *
 * SETUP:
 *  1. Run Evolution API via Docker:
 *     docker run -d -p 8080:8080 -e AUTHENTICATION_API_KEY="YOUR_KEY" atendai/evolution-api:latest
 *  2. Create an instance (once):
 *     POST http://localhost:8080/instance/create  { "instanceName": "casthub", "qrcode": true }
 *  3. Connect via QR code:
 *     GET http://localhost:8080/instance/connect/casthub
 *     → Scan the returned QR code with your WhatsApp phone
 *  4. Set env vars: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
 */

const BASE_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const INSTANCE = process.env.EVOLUTION_INSTANCE ?? "Evolution1";

// ─── Types returned by Evolution API ─────────────────────────────────────────

export interface WAMessage {
  key: {
    remoteJid: string; // group JID like "120363xxxx@g.us"
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
  };
  messageTimestamp: number; // unix seconds
  pushName?: string; // sender display name
}

export interface WAGroup {
  id: string; // JID: "120363xxxx@g.us"
  subject: string; // group name
  participants: { id: string; admin?: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headers() {
  return {
    apikey: API_KEY,
    "Content-Type": "application/json",
  };
}

/** Extract plain text from any message type */
export function extractMessageText(msg: WAMessage): string {
  return (
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    msg.message?.imageMessage?.caption ??
    ""
  );
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * List all WhatsApp groups the instance is currently in.
 * Returns groups with their JID and name.
 */
export async function getGroups(): Promise<WAGroup[]> {
  const url = `${BASE_URL}/group/fetchAllGroups/${INSTANCE}?getParticipants=false`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Evolution API getGroups failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Fetch messages from a specific group sent after `fromTimestamp` (unix seconds).
 * Evolution API endpoint: POST /chat/findMessages/{instance}
 *
 * @param groupJid  - The group's JID, e.g. "120363xxxx@g.us"
 * @param fromTimestamp - Unix timestamp in seconds (start of window)
 */
export async function getGroupMessages(
  groupJid: string,
  fromTimestamp: number
): Promise<WAMessage[]> {
  const url = `${BASE_URL}/chat/findMessages/${INSTANCE}`;

  const body = {
    where: {
      key: { remoteJid: groupJid },
      messageTimestamp: { gte: fromTimestamp },
    },
    limit: 500,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Evolution API getGroupMessages failed: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  // Response is { messages: { records: WAMessage[] } }
  return data?.messages?.records ?? [];
}

/**
 * Check if the Evolution API instance is connected (not just running).
 * Returns true if WhatsApp is authenticated via QR.
 */
export async function isConnected(): Promise<boolean> {
  try {
    const url = `${BASE_URL}/instance/connectionState/${INSTANCE}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.instance?.state === "open";
  } catch {
    return false;
  }
}
