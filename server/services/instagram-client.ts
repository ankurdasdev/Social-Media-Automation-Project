import { execFile } from "child_process";
import path from "path";

const SCRIPT_PATH = path.join(process.cwd(), "server", "services", "ig_bridge.py");
const PYTHON_CMD = path.join(process.cwd(), "venv", "bin", "python3");

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

async function runIgBridge(command: string, sessionData: string, ...args: string[]): Promise<any> {
  // If sessionData is actually a JSON string (e.g. from an old login), we should extract the sessionid
  let actualSessionId = sessionData;
  try {
    const parsed = JSON.parse(sessionData);
    if (parsed.authorization_data && parsed.authorization_data.sessionid) {
      actualSessionId = parsed.authorization_data.sessionid;
    }
  } catch (e) {
    // Keep it as raw string if it's already a sessionid
  }

  // Remove url encoding if present
  try {
    actualSessionId = decodeURIComponent(actualSessionId);
  } catch (e) {}

  return new Promise((resolve, reject) => {
    execFile(PYTHON_CMD, [SCRIPT_PATH, command, actualSessionId, ...args], { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error("[ig_bridge stderr]:", stderr);
        return reject(new Error(`IG Bridge Error: ${error.message}`));
      }
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (e) {
        console.error("[ig_bridge decode error]:", stdout);
        reject(new Error("Failed to parse IG bridge output"));
      }
    });
  });
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function login(username: string, password?: string, verificationCode?: string) {
  // Unsupported via bridge for now, rely on sessionid
  return { success: false, error: "Not supported in local bridge mode. Please use Connect via Session Cookie." };
}

export async function getAccountPosts(
  username: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  // Mocked or unimplemented via bridge for now
  return [];
}

export async function getHashtagPosts(
  hashtag: string,
  sinceTimestamp: number,
  sessionData: string
): Promise<IGPost[]> {
  return [];
}

export async function getThreads(sessionData: string, amount: number = 50) {
  try {
    return await runIgBridge("getThreads", sessionData, amount.toString());
  } catch (e: any) {
    console.error("[igClient] getThreads error:", e.message);
    return [];
  }
}

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
    return await runIgBridge("getGroupMessages", sessionData, threadId, "20");
  } catch (err: any) {
    console.error("[igClient] getGroupMessages error:", err.message);
    return [];
  }
}

export async function sendDirectMessage(
  usernames: string[],
  text: string,
  sessionData: string
): Promise<any> {
  if (sessionData === 'demo-session-id') {
    return { success: true, message: "Demo message sent successfully." };
  }

  try {
    return await runIgBridge("sendDirectMessage", sessionData, JSON.stringify(usernames), text);
  } catch (err: any) {
    console.error("[igClient] sendDirectMessage error:", err.message);
    throw err;
  }
}

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
    import("fs").then(fs => {
      const tempPath = path.join(process.cwd(), "uploads", fileName);
      fs.writeFileSync(tempPath, fileBuffer);
      runIgBridge("sendDirectPhoto", sessionData, JSON.stringify(usernames), tempPath)
        .catch(console.error)
        .finally(() => fs.unlinkSync(tempPath));
    });
    // Fire and forget since instagrapi file send might be slow
    return { success: true };
  } catch (err: any) {
    console.error("[igClient] sendDirectPhoto error:", err.message);
    throw err;
  }
}

export async function isReachable(): Promise<boolean> {
  return true;
}
