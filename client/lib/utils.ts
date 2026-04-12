import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Auth Token Management ────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = "casthub_auth_token";
const USER_ID_KEY = "casthub_user_id";

/** Store JWT token after login/signup */
export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  // Also decode and cache the userId so every component can call getOrCreateUserId()
  try {
    const payload = decodeJwtPayload(token);
    if (payload?.userId) {
      localStorage.setItem(USER_ID_KEY, payload.userId);
    }
  } catch {}
}

/** Get the raw JWT token for Authorization headers */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/** Clear all auth data on logout */
export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

/** Decode JWT without verifying (verification is server-side) */
function decodeJwtPayload(token: string): { userId: string; email: string; name: string; exp: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Check if the stored token is still valid (not expired) */
export function isTokenValid(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 > Date.now();
}

/** Get the current user's UUID — used everywhere as userId */
export function getOrCreateUserId(): string {
  // Primary: get from stored userId (set on login/signup)
  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) return stored;

  // Fallback: try to decode from JWT
  const token = getAuthToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.userId) {
      localStorage.setItem(USER_ID_KEY, payload.userId);
      return payload.userId;
    }
  }

  // Last resort: generate a temporary UUID (pre-login state)
  const tempId = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, tempId);
  return tempId;
}

/** Get current user info from the JWT (no network call needed) */
export function getCurrentUser(): { userId: string; email: string; name: string } | null {
  const token = getAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload?.userId) return null;
  return { userId: payload.userId, email: payload.email, name: payload.name };
}
