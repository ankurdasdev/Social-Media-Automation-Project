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

// ─── Types returned by Evolution API ─────────────────────────────────────────
// ... types ...
export interface WAMessage {
  key: {
    remoteJid: string; 
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
  };
  messageTimestamp: number; 
  pushName?: string; 
}

export interface WAGroup {
  id: string; 
  subject: string; 
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
 */
export async function getGroups(instanceName: string): Promise<WAGroup[]> {
  const url = `${BASE_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    throw new Error(`Evolution API getGroups failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Fetch messages from a specific group.
 */
export async function getGroupMessages(
  instanceName: string,
  groupJid: string,
  fromTimestamp: number
): Promise<WAMessage[]> {
  const url = `${BASE_URL}/chat/findMessages/${instanceName}`;

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
  return data?.messages?.records ?? [];
}

/**
 * Send a text message to a WhatsApp JID.
 */
export async function sendMessage(
  instanceName: string,
  numberOrJid: string,
  text: string
): Promise<any> {
  const url = `${BASE_URL}/message/sendText/${instanceName}`;
  const body = {
    number: numberOrJid,
    text,
    linkPreview: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Evolution API sendMessage failed: ${res.status} ${errText}`);
  }
  return res.json();
}

/**
 * Send a media message (image/document) via URL.
 */
export async function sendMedia(
  instanceName: string,
  number: string,
  mediaUrl: string,
  mediaType: "image" | "video" | "audio" | "document" = "image",
  caption?: string,
  fileName?: string
): Promise<any> {
  const url = `${BASE_URL}/message/sendMedia/${instanceName}`;
  const body = {
    number,
    media: mediaUrl,
    mediatype: mediaType,
    caption,
    fileName,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Evolution API sendMedia failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
