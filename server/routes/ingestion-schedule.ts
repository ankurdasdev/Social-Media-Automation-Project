/**
 * Ingestion Schedule API
 * GET  /api/ingestion/schedule?userId=...  → get current schedule
 * PUT  /api/ingestion/schedule             → update schedule time
 * POST /api/ingestion/run-now             → trigger manual run
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
 * cronTime: HH:MM in 24h format, e.g. "02:00"
 */
export function scheduleUserIngestion(userId: string, cronTime: string, enabled: boolean) {
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

  const [hours, minutes] = cronTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    console.error(`[ingestion-scheduler] Invalid time format: ${cronTime}`);
    return;
  }

  const cronExpression = `${minutes} ${hours} * * *`; // daily at HH:MM
  console.log(`[ingestion-scheduler] Scheduling user ${userId} at ${cronTime} (cron: ${cronExpression})`);

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[ingestion-scheduler] Running scheduled job for user ${userId} at ${cronTime}`);
    try {
      await runIngestionJob();
    } catch (e: any) {
      console.error(`[ingestion-scheduler] Job failed for user ${userId}:`, e.message);
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
      ingestion_schedule_time: string;
      ingestion_enabled: boolean;
    }>("SELECT id, ingestion_schedule_time, ingestion_enabled FROM users");

    for (const user of users) {
      scheduleUserIngestion(
        user.id,
        user.ingestion_schedule_time || "02:00",
        user.ingestion_enabled !== false
      );
    }
    console.log(`[ingestion-scheduler] Restored schedules for ${users.length} users`);
  } catch (e: any) {
    console.error("[ingestion-scheduler] Failed to restore schedules:", e.message);
  }
}

// GET /api/ingestion/schedule
ingestionRouter.get("/schedule", (async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const user = await queryOne<{
    ingestion_schedule_time: string;
    ingestion_enabled: boolean;
  }>("SELECT ingestion_schedule_time, ingestion_enabled FROM users WHERE id = $1", [userId]);

  res.json({
    scheduleTime: user?.ingestion_schedule_time ?? "02:00",
    enabled: user?.ingestion_enabled !== false,
  });
}) as RequestHandler);

// PUT /api/ingestion/schedule
ingestionRouter.put("/schedule", (async (req, res) => {
  const { userId, scheduleTime, enabled } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  // Validate HH:MM format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (scheduleTime && !timeRegex.test(scheduleTime)) {
    return res.status(400).json({ error: "Invalid time format. Use HH:MM (24h)" });
  }

  await query(
    `UPDATE users 
     SET ingestion_schedule_time = COALESCE($1, ingestion_schedule_time),
         ingestion_enabled = COALESCE($2, ingestion_enabled),
         updated_at = NOW()
     WHERE id = $3`,
    [scheduleTime ?? null, enabled !== undefined ? enabled : null, userId]
  );

  // Restart cron with new settings
  const user = await queryOne<{
    ingestion_schedule_time: string;
    ingestion_enabled: boolean;
  }>("SELECT ingestion_schedule_time, ingestion_enabled FROM users WHERE id = $1", [userId]);

  scheduleUserIngestion(userId, user!.ingestion_schedule_time, user!.ingestion_enabled);

  res.json({ success: true, scheduleTime: user!.ingestion_schedule_time, enabled: user!.ingestion_enabled });
}) as RequestHandler);

// POST /api/ingestion/run-now
ingestionRouter.post("/run-now", (async (req, res) => {
  try {
    const result = await runIngestionJob();
    res.json({ success: true, result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}) as RequestHandler);

// GET /api/ingestion/status
ingestionRouter.get("/status", (_req, res) => {
  res.json(getIngestionState());
});
