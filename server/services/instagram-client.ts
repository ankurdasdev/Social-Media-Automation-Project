/**
 * Instagram Client via instagrapi Hosted API
 *
 * instagrapi wraps Instagram's private API in a REST service.
 * Hosted: https://instagrapi.com  (get API key from dashboard)
 *
 * SETUP:
 *  1. Sign up at https://instagrapi.com
 *  2. Get your API key from Settings → API Keys
 *  3. Set env vars: INSTAGRAPI_API_URL, INSTAGRAPI_API_KEY,
 *                   INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD
 *
 * SELF-HOSTED ALTERNATIVE:
 *  pip install instagrapi fastapi uvicorn
 *  Then set INSTAGRAPI_API_URL=http://localhost:8000
 *
 * What we monitor:
 *  - "account"  → recent posts from that IG account's feed
 *  - "hashtag"  → recent posts with that hashtag
 *  - "group"    → incoming DM group thread messages
 */

const BASE_URL = process.env.INSTAGRAPI_API_URL ?? "https://api.instagrapi.com";
const API_KEY = process.env.INSTAGRAPI_API_KEY ?? "";
const IG_USERNAME = process.env.INSTAGRAM_USERNAME ?? "";
const IG_PASSWORD = process.env.INSTAGRAM_PASSWORD ?? "";

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

/** Session login payload — sent with each request to the hosted API */
function authBody(extra: Record<string, unknown> = {}) {
  return {
    username: IG_USERNAME,
    password: IG_PASSWORD,
    ...extra,
  };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetch recent posts from a public/private account after `sinceTimestamp`.
 *
 * @param username      - Instagram username (without @)
 * @param sinceTimestamp - Unix timestamp in seconds
 */
export async function getAccountPosts(
  username: string,
  sinceTimestamp: number
): Promise<IGPost[]> {
  const url = `${BASE_URL}/v1/user/medias`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(authBody({ username_or_id: username, amount: 50 })),
  });

  if (!res.ok) {
    console.error(`instagrapi getAccountPosts failed for @${username}: ${res.status}`);
    return [];
  }

  const posts: IGPost[] = await res.json();
  return posts.filter((p) => p.taken_at >= sinceTimestamp);
}

/**
 * Fetch recent posts for a hashtag after `sinceTimestamp`.
 *
 * @param hashtag        - Hashtag without the # symbol (e.g. "castingcallmumbai")
 * @param sinceTimestamp - Unix timestamp in seconds
 */
export async function getHashtagPosts(
  hashtag: string,
  sinceTimestamp: number
): Promise<IGPost[]> {
  const cleanTag = hashtag.replace(/^#/, "");
  const url = `${BASE_URL}/v1/hashtag/medias/recent`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(authBody({ name: cleanTag, amount: 50 })),
  });

  if (!res.ok) {
    console.error(`instagrapi getHashtagPosts failed for #${cleanTag}: ${res.status}`);
    return [];
  }

  const posts: IGPost[] = await res.json();
  return posts.filter((p) => p.taken_at >= sinceTimestamp);
}

/**
 * Fetch messages from a DM group thread after `sinceTimestamp`.
 * Thread IDs come from the source registry (group type sources).
 *
 * @param threadId       - Instagram DM thread ID
 * @param sinceTimestamp - Unix timestamp in seconds
 */
export async function getGroupMessages(
  threadId: string,
  sinceTimestamp: number
): Promise<IGMessage[]> {
  const url = `${BASE_URL}/v1/direct/thread`;

  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(authBody({ thread_id: threadId, amount: 100 })),
  });

  if (!res.ok) {
    console.error(`instagrapi getGroupMessages failed for thread ${threadId}: ${res.status}`);
    return [];
  }

  const thread: IGThread = await res.json();
  const sinceUs = sinceTimestamp * 1_000_000; // convert to microseconds
  return (thread.messages ?? []).filter((m) => m.timestamp >= sinceUs);
}

/** Simple connectivity check */
export async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { headers: headers() });
    return res.ok;
  } catch {
    return false;
  }
}
