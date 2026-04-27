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
  const url = `${BASE_URL}/auth/login`;
  
  const form = new URLSearchParams();
  if (username) form.append("username", username);
  if (password) form.append("password", password);
  if (verificationCode) form.append("verification_code", verificationCode);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = await res.text();
    }
    return { success: false, error: errorData };
  }

  // instagrapi-rest returns the sessionid string directly as JSON string
  const sessionid = await res.json();
  return { success: true, session: sessionid };
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
    const userId = await igRequest("/user/id_from_username", sessionData, {
      username,
    });

    const posts: IGPost[] = await igRequest("/media/user_medias", sessionData, {
      user_id: userId,
      amount: 50,
    });
    return posts.filter((p) => p.taken_at >= sinceTimestamp);
  } catch (err) {
    console.error(`IG getAccountPosts failed:`, err);
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
  const cleanTag = hashtag.replace(/^#/, "");
  try {
    const posts: IGPost[] = await igRequest("/hashtag/medias/recent", sessionData, {
      name: cleanTag,
      amount: 50,
    });
    return posts.filter((p) => p.taken_at >= sinceTimestamp);
  } catch (err) {
    console.error(`IG getHashtagPosts failed:`, err);
    return [];
  }
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
    const thread: IGThread = await igRequest("/direct/thread", sessionData, {
      thread_id: threadId,
      amount: 100,
    });
    const sinceUs = sinceTimestamp * 1_000_000;
    return (thread.messages ?? []).filter((m) => m.timestamp >= sinceUs);
  } catch (err) {
    console.error(`IG getGroupMessages failed:`, err);
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
  return igRequest("/direct/message", sessionData, {
    usernames,
    text,
  });
}

/** Simple connectivity check */
export async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/docs`, { headers: headers() });
    return res.ok;
  } catch {
    return false;
  }
}
