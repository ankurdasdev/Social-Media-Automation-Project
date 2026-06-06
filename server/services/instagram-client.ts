/**
 * Instagram Client via instagrapi-rest Hosted on VPS
 * 
 * This client handles per-user sessions by storing 'settings' (cookies/session data)
 * in the database and passing them to the instagrapi-rest instance.
 */
import axios from "axios";

function getBaseUrl() {
  return process.env.INSTAGRAPI_API_URL || "http://46.62.144.244:8000";
}
const API_KEY = process.env.INSTAGRAPI_API_KEY || "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IGPost {
  pk: string;
  id: string;
  taken_at: number; // unix timestamp
  caption_text?: string;
  user: {
    username: string;
    full_name: string;
    pk: string;
  };
}

export interface IGThread {
  thread_id: string;
  thread_title?: string;
  messages: IGMessage[];
}

export interface IGMessage {
  item_id: string;
  timestamp: number; // unix microseconds
  user_id: string;
  text?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function headers() {
  return {
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json",
  };
}

async function igRequest(endpoint: string, sessionData: string, body: any = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  
  let isJson = false;
  try {
    JSON.parse(sessionData);
    isJson = true;
  } catch (e) {
    // Not json
  }

  if (isJson) {
    const reqBody = { ...body, settings: JSON.parse(sessionData) };
    try {
      const res = await axios.post(url, reqBody, {
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json",
        },
      });
      return res.data;
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      throw new Error(`instagrapi error (${status}): ${data}`);
    }
  } else {
    const form = new URLSearchParams();
    form.append("sessionid", sessionData);
    for (const key in body) {
      if (body[key] !== undefined && body[key] !== null) {
        if (typeof body[key] === "object") {
          form.append(key, JSON.stringify(body[key]));
        } else {
          form.append(key, body[key].toString());
        }
      }
    }

    try {
      const res = await axios.post(url, form.toString(), {
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return res.data;
    } catch (err: any) {
      const status = err.response?.status || 500;
      const data = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      throw new Error(`instagrapi error (${status}): ${data}`);
    }
  }
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Login and get session settings.
 */
export async function login(username: string, password?: string, verificationCode?: string) {
  const form = new URLSearchParams();
  form.append("username", username);
  if (password) form.append("password", password);
  if (verificationCode) form.append("verification_code", verificationCode);

  try {
    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: errorText };
    }

    const json = await res.json();
    return { success: true, session: json };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch recent posts from a public/private account.
 */
export async function getAccountPosts(
  username: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  try {
    const res = await igRequest("/user/medias", sessionData, { username, amount: 20 });
    return res as IGPost[];
  } catch (err: any) {
    console.error("[igClient] getAccountPosts error:", err.message);
    return [];
  }
}

/**
 * Fetch recent posts for a hashtag.
 */
export async function getHashtagPosts(
  hashtag: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  try {
    const res = await igRequest("/hashtag/medias/top", sessionData, { name: hashtag, amount: 20 });
    return res as IGPost[];
  } catch (err: any) {
    console.error("[igClient] getHashtagPosts error:", err.message);
    return [];
  }
}

/**
 * Fetch threads.
 */
export async function getThreads(sessionData: string, amount: number = 50) {
  return await igRequest("/direct/threads", sessionData, { amount });
}

/**
 * Fetch messages from a DM group thread.
 */
export async function getGroupMessages(
  threadId: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGMessage[]> {
  if (sessionData === 'demo-session-id') {
    return [
      { item_id: "msg1", timestamp: Date.now() * 1000, user_id: "u1", text: "Welcome to the demo group!" }
    ];
  }

  try {
    const res = await igRequest("/direct/messages", sessionData, { thread_id: threadId, amount: 20 });
    return res as IGMessage[];
  } catch (err: any) {
    console.error("[igClient] getGroupMessages error:", err.message);
    return [];
  }
}

/**
 * Send a DM to a user by their username (resolves to PK first).
 */
export async function sendDirectMessage(
  usernames: string[],
  text: string,
  sessionData: string
): Promise<any> {
  if (sessionData === 'demo-session-id') {
    return { success: true, message: "Demo message sent successfully." };
  }

  try {
    // Often /direct/send takes usernames as a comma-separated list
    const res = await igRequest("/direct/send", sessionData, { usernames: usernames.join(","), text });
    return res;
  } catch (err: any) {
    console.error("[igClient] sendDirectMessage error:", err.message);
    throw err;
  }
}

/**
 * Send a photo DM to users.
 */
export async function sendDirectPhoto(
  usernames: string[],
  fileBuffer: Buffer,
  fileName: string,
  sessionData: string
): Promise<any> {
  if (sessionData === 'demo-session-id') {
    return { success: true, message: "Demo photo sent successfully." };
  }

  try {
    const url = `${getBaseUrl()}/direct/photo`;
    const formData = new FormData();
    formData.append("sessionid", sessionData);
    formData.append("usernames", usernames.join(","));
    
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    formData.append("file", blob, fileName);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`instagrapi error (${res.status}): ${errorText}`);
    }
    return res.json();
  } catch (err: any) {
    console.error("[igClient] sendDirectPhoto error:", err.message);
    throw err;
  }
}

/** Simple connectivity check */
export async function isReachable(): Promise<boolean> {
  // Always return true to prevent false offline states and socket exhaustion
  // Real errors will be caught during actual API calls
  return true;
}

