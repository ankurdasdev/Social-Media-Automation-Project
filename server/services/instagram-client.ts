/**
 * Instagram Client via instagrapi-rest Hosted on VPS
 * 
 * This client handles per-user sessions by storing 'settings' (cookies/session data)
 * in the database and passing them to the instagrapi-rest instance.
 */

const BASE_URL = process.env.INSTAGRAPI_API_URL || "http://localhost:8000";
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
  const url = `${BASE_URL}${endpoint}`;
  
  let isJson = false;
  try {
    JSON.parse(sessionData);
    isJson = true;
  } catch (e) {
    // Not json
  }

  if (isJson) {
    const reqBody = { ...body, settings: JSON.parse(sessionData) };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`instagrapi error (${res.status}): ${errorText}`);
    }
    return res.json();
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

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`instagrapi error (${res.status}): ${errorText}`);
    }
    return res.json();
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
    const res = await fetch(`${BASE_URL}/auth/login`, {
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
  try {
    // Often /direct/send takes usernames as a comma-separated list
    const res = await igRequest("/direct/send", sessionData, { usernames: usernames.join(","), text });
    return res;
  } catch (err: any) {
    console.error("[igClient] sendDirectMessage error:", err.message);
    throw err;
  }
}

/** Simple connectivity check */
export async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/docs`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
