import { RequestHandler } from "express";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { query, queryOne } from "../db/index";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Build the redirect URI directly from the incoming HTTP request.
 * Works automatically in all environments — local dev, staging, production.
 * No env vars needed. If GOOGLE_REDIRECT_URI is set it still takes precedence.
 */
function getRedirectUri(req: Parameters<RequestHandler>[0]): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  // Trust proxy headers (set by Nginx/Cloudflare/Easypanel)
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
    req.protocol ||
    "http";
  const host =
    (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() ||
    req.get("host") ||
    "localhost:8080";
  return `${proto}://${host}/api/auth/google/callback`;
}

function makeOAuth2Client(req: Parameters<RequestHandler>[0]): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(req)
  );
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
// Redirects user to Google OAuth consent screen
export const handleGoogleAuth: RequestHandler = (req, res) => {
  const oauth2Client = makeOAuth2Client(req);
  const userId = (req.query.userId as string) || "default";
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent select_account",
    include_granted_scopes: true,
    state,
  });

  res.redirect(authUrl);
};

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
// Handles the redirect back from Google
export const handleGoogleCallback: RequestHandler = async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`/?auth=error&reason=${encodeURIComponent(error)}`);
  }

  try {
    const oauth2Client = makeOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Upsert user
    let user = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [userInfo.email]
    );

    if (!user) {
      const [newUser] = await query<{ id: string }>(
        "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id",
        [userInfo.email, userInfo.name || userInfo.email]
      );
      user = newUser;
    }

    // Store / update tokens
    await query(
      `INSERT INTO google_tokens (user_id, access_token, refresh_token, id_token, token_expiry, scopes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
         id_token = EXCLUDED.id_token,
         token_expiry = EXCLUDED.token_expiry,
         scopes = EXCLUDED.scopes,
         updated_at = NOW()`,
      [
        user!.id,
        tokens.access_token,
        tokens.refresh_token,
        tokens.id_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokens.scope, // This is the space-separated string of scopes
      ]
    );

    // Redirect back to app with userId
    res.redirect(`/settings?auth=success&userId=${user!.id}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.redirect("/?auth=error&reason=token_exchange_failed");
  }
};

// ── GET /api/auth/google/status?userId=xxx ───────────────────────────────────
export const handleGoogleStatus: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;

  const token = await queryOne<{
    access_token: string;
    refresh_token: string;
    token_expiry: string;
    drive_folder_id: string;
    drive_folder_name: string;
  }>(
    "SELECT access_token, refresh_token, token_expiry, drive_folder_id, drive_folder_name FROM google_tokens WHERE user_id = $1",
    [userId]
  );

  if (!token) {
    return res.json({ connected: false });
  }

  const isExpired = token.token_expiry
    ? new Date(token.token_expiry) < new Date()
    : false;

  // Try to refresh if expired
  if (isExpired && token.refresh_token) {
    try {
      // For refresh we don't need a real request-derived redirect URI
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: token.refresh_token });
      const { credentials } = await oauth2Client.refreshAccessToken();
      await query(
        "UPDATE google_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE user_id = $3",
        [credentials.access_token, credentials.expiry_date ? new Date(credentials.expiry_date) : null, userId]
      );
      return res.json({
        connected: true,
        needsReauth: false,
        driveFolderId: token.drive_folder_id,
        driveFolderName: token.drive_folder_name,
        userEmail: null,
      });
    } catch (err: any) {
      console.error("Google token refresh failed:", err.message);
      return res.json({ connected: true, needsReauth: true, error: "Token refresh failed" });
    }
  }

  try {
    const user = await queryOne<{ email: string; name: string }>(
      "SELECT email, name FROM users WHERE id = $1",
      [userId]
    );

    res.json({
      connected: true,
      needsReauth: isExpired,
      driveFolderId: token.drive_folder_id,
      driveFolderName: token.drive_folder_name,
      userEmail: user?.email,
      userName: user?.name,
    });
  } catch (err: any) {
    console.error("Error fetching user for status:", err.message);
    res.json({ connected: true, needsReauth: true, error: "Database error" });
  }
};

// ── DELETE /api/auth/google?userId=xxx ───────────────────────────────────────
export const handleGoogleDisconnect: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  await query("DELETE FROM google_tokens WHERE user_id = $1", [userId]);
  res.json({ success: true });
};

// ── GET /api/auth/google/check-scopes?userId=xxx ────────────────────────────
// Tests whether the stored token actually has gmail.send scope.
// Returns { hasSendScope: boolean }
export const handleCheckGoogleScopes: RequestHandler = async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const token = await queryOne<{ scopes: string }>(
      "SELECT scopes FROM google_tokens WHERE user_id = $1",
      [userId]
    );

    if (!token || !token.scopes) {
       // Fallback: try a light Gmail call to see if we have access
       const gmailClient = await getGmailClient(userId);
       try {
         await gmailClient.users.getProfile({ userId: "me" });
         // Profile check passed, but we still don't know about SEND scope.
         // Better to assume we need re-auth if scopes column is missing or empty.
         return res.json({ hasSendScope: false, needsReauth: true, error: "Permissions need update" });
       } catch (e) {
         return res.json({ hasSendScope: false, needsReauth: true });
       }
    }

    const hasSend = token.scopes.includes("gmail.send");
    res.json({ 
      hasSendScope: hasSend, 
      needsReauth: !hasSend,
      message: !hasSend ? "GMAIL_SCOPE_MISSING: Please ensure you check the 'Send email on your behalf' box during re-authentication." : undefined
    });
  } catch (err: any) {
    const isScope = err?.message?.toLowerCase().includes("insufficient") || 
                    err?.code === 403 ||
                    err?.errors?.[0]?.reason === "insufficientPermissions";
    if (isScope) {
      return res.json({ 
        hasSendScope: false, 
        needsReauth: true, 
        message: "Your Google account permissions are insufficient. Please re-authenticate and check all permission boxes." 
      });
    }
    return res.json({ hasSendScope: false, needsReauth: false, error: err.message });
  }
};


// ── PUT /api/auth/google/folder ───────────────────────────────────────────────
// Save selected Drive folder
export const handleSetDriveFolder: RequestHandler = async (req, res) => {
  const { userId, folderId, folderName } = req.body;
  await query(
    "UPDATE google_tokens SET drive_folder_id = $1, drive_folder_name = $2, updated_at = NOW() WHERE user_id = $3",
    [folderId, folderName, userId]
  );
  res.json({ success: true });
};

// ── Helper: get an authenticated Drive client for a user ─────────────────────
export async function getDriveClient(userId: string) {
  const token = await queryOne<{
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  }>(
    "SELECT access_token, refresh_token, token_expiry FROM google_tokens WHERE user_id = $1",
    [userId]
  );
  if (!token) throw new Error("User not connected to Google");

  // For Drive/Gmail helpers: redirect URI doesn't matter; we just need client+secret
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.token_expiry ? new Date(token.token_expiry).getTime() : undefined,
  });

  // Auto-refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await query(
        "UPDATE google_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE user_id = $3",
        [tokens.access_token, tokens.expiry_date ? new Date(tokens.expiry_date) : null, userId]
      );
    }
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

// ── Helper: get an authenticated Gmail client for a user ─────────────────────
export async function getGmailClient(userId: string) {
  const token = await queryOne<{
    access_token: string;
    refresh_token: string;
    token_expiry: string;
  }>(
    "SELECT access_token, refresh_token, token_expiry FROM google_tokens WHERE user_id = $1",
    [userId]
  );
  if (!token) throw new Error("User not connected to Google (Gmail)");

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.token_expiry ? new Date(token.token_expiry).getTime() : undefined,
  });

  // Auto-refresh logic
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await query(
        "UPDATE google_tokens SET access_token = $1, token_expiry = $2, updated_at = NOW() WHERE user_id = $3",
        [tokens.access_token, tokens.expiry_date ? new Date(tokens.expiry_date) : null, userId]
      );
    }
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}