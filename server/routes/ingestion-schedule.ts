/**
 * Ingestion Schedule API
 * GET  /api/ingestion/schedule?userId=...  → get current schedule + scan duration
 * PUT  /api/ingestion/schedule             → update scan duration & enabled flag
 * POST /api/ingestion/run-now             → trigger manual run (with optional sinceHours override)
 * GET  /api/ingestion/status              → last run status
 */

import { RequestHandler, Router } from "express";
import { query, queryOne } from "../db/index";
import { runIngestionJob, getIngestionState } from "../jobs/ingestion-job";
import cron, { ScheduledTask } from "node-cron";

export const ingestionRouter = Router();

// Active cron task per user — keyed by userId
const activeCrons: Map<string, ScheduledTask> = new Map();

/**
 * Start/restart the cron job for a specific user.
 * Runs once daily at midnight to trigger the scan using the stored scanDurationHours.
 */
export function scheduleUserIngestion(
  userId: string,
  scanDurationHours: number,
  enabled: boolean
) {
  // Cancel existing job if any
  const existing = activeCrons.get(userId);
  if (existing) {
    existing.stop();
    activeCrons.delete(userId);
  }

  if (!enabled) {
    console.log(`[ingestion-scheduler] Job disabled for user ${userId}`);
    return;
  }

  // Run once daily at midnight; the scan window is controlled by scanDurationHours
  const cronExpression = `0 0 * * *`;
  console.log(
    `[ingestion-scheduler] Scheduling user ${userId} — daily midnight run, scanning last ${scanDurationHours}h`
  );

  const task = cron.schedule(cronExpression, async () => {
    console.log(
      `[ingestion-scheduler] Running scheduled job for user ${userId}, scan window: ${scanDurationHours}h`
    );
    try {
      await runIngestionJob(scanDurationHours);
    } catch (e: any) {
      console.error(
        `[ingestion-scheduler] Job failed for user ${userId}:`,
        e.message
      );
    }
  });

  activeCrons.set(userId, task);
}

/**
 * Boot: restore all user schedules on server start.
 */
export async function initIngestionSchedules() {
  try {
    const users = await query<{
      id: string;
      scan_duration_hours: number;
      ingestion_enabled: boolean;
    }>(
      "SELECT id, scan_duration_hours, ingestion_enabled FROM users"
    );

    for (const user of users) {
      scheduleUserIngestion(
        user.id,
        user.scan_duration_hours ?? 24,
        user.ingestion_enabled !== false
      );
    }
    console.log(
      `[ingestion-scheduler] Restored schedules for ${users.length} users`
    );
  } catch (e: any) {
    console.error(
      "[ingestion-scheduler] Failed to restore schedules:",
      e.message
    );
  }
}

// GET /api/ingestion/schedule
ingestionRouter.get("/schedule", (async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const user = await queryOne<{
    scan_duration_hours: number;
    ingestion_enabled: boolean;
  }>(
    "SELECT scan_duration_hours, ingestion_enabled FROM users WHERE id = $1",
    [userId]
  );

  res.json({
    scanDurationHours: user?.scan_duration_hours ?? 24,
    enabled: user?.ingestion_enabled !== false,
  });
}) as RequestHandler);

// PUT /api/ingestion/schedule
ingestionRouter.put("/schedule", (async (req, res) => {
  const { userId, scanDurationHours, enabled } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (
    scanDurationHours !== undefined &&
    (typeof scanDurationHours !== "number" ||
      scanDurationHours < 1 ||
      scanDurationHours > 720)
  ) {
    return res
      .status(400)
      .json({ error: "scanDurationHours must be a number between 1 and 720" });
  }

  // Ensure column exists (graceful fallback if migration not run yet)
  try {
    await query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS scan_duration_hours INTEGER DEFAULT 24`
    );
  } catch (_) {
    // ignore if already exists or no permission
  }

  await query(
    `UPDATE users
     SET scan_duration_hours = COALESCE($1, scan_duration_hours),
         ingestion_enabled = COALESCE($2, ingestion_enabled),
         updated_at = NOW()
     WHERE id = $3`,
    [
      scanDurationHours ?? null,
      enabled !== undefined ? enabled : null,
      userId,
    ]
  );

  const user = await queryOne<{
    scan_duration_hours: number;
    ingestion_enabled: boolean;
  }>(
    "SELECT scan_duration_hours, ingestion_enabled FROM users WHERE id = $1",
    [userId]
  );

  scheduleUserIngestion(
    userId,
    user!.scan_duration_hours ?? 24,
    user!.ingestion_enabled
  );

  res.json({
    success: true,
    scanDurationHours: user!.scan_duration_hours ?? 24,
    enabled: user!.ingestion_enabled,
  });
}) as RequestHandler);

// POST /api/ingestion/run-now
// Body: { sinceHours?: number }  — defaults to the user's stored scanDurationHours
ingestionRouter.post("/run-now", (async (req, res) => {
  try {
    // Allow the client to override sinceHours for this one-off run
    const overrideHours =
      typeof req.body?.sinceHours === "number" ? req.body.sinceHours : null;

    let sinceHours = overrideHours ?? 24;

    // Try to read per-user scan_duration_hours if no override
    if (overrideHours === null) {
      try {
        const firstUser = await queryOne<{ scan_duration_hours: number }>(
          "SELECT scan_duration_hours FROM users LIMIT 1"
        );
        if (firstUser?.scan_duration_hours) {
          sinceHours = firstUser.scan_duration_hours;
        }
      } catch (_) {}
    }

    const result = await runIngestionJob(sinceHours);
    res.json({ success: true, result, sinceHours });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}) as RequestHandler);

// GET /api/ingestion/status
ingestionRouter.get("/status", (_req, res) => {
  res.json(getIngestionState());
});
