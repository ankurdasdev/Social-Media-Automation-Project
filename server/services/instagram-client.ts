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
  
  const form = new URLSearchParams();
  form.append("sessionid", sessionData);
  for (const key in body) {
    if (body[key] !== undefined && body[key] !== null) {
      if (typeof body[key] === 'object') {
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

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Login and get session settings.
 */
export async function login(username: string, password?: string, verificationCode?: string) {
  // MOCK LOGIN
  return { success: true, session: "mocked_session_id_12345" };
}

/**
 * Fetch recent posts from a public/private account.
 */
export async function getAccountPosts(
  username: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  // MOCK POSTS
  return [];
}

/**
 * Fetch recent posts for a hashtag.
 */
export async function getHashtagPosts(
  hashtag: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  // MOCK HASHTAG POSTS
  return [];
}

/**
 * Fetch messages from a DM group thread.
 */
export async function getGroupMessages(
  threadId: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGMessage[]> {
  // MOCK MESSAGES
  return [];
}

/**
 * Send a DM to a user by their username (resolves to PK first).
 */
export async function sendDirectMessage(
  usernames: string[],
  text: string,
  sessionData: string
): Promise<any> {
  // MOCK SEND DM
  return { success: true };
}

/** Simple connectivity check — hits /docs to avoid root-level 307 redirect */
export async function isReachable(): Promise<boolean> {
  // MOCK REACHABLE
  return true;
}
