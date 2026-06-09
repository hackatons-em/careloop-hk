// Daily check-in scheduler (server-only, in-process) — SELF-HOSTED ONLY.
//
// Started once on server boot via instrumentation.ts. When CARELOOP_CHECKIN_TIME
// (24h "HH:MM", Hong Kong time by default) is set, it runs the agent's morning
// round (every patient with a known WhatsApp number) at that time each day.
// OFF by default so dev never auto-sends.
//
// On Vercel this is a NO-OP: serverless instances spin down, so setInterval is
// unreliable there — Vercel Cron (vercel.json -> GET /api/agent/send-round)
// drives the daily round in that environment instead.

import { sendDailyCheckInRound } from "./agent";
import { logger } from "./logger";
import { getDefaultOrgId } from "./org";

export function startScheduler(): void {
  const g = globalThis as unknown as { __careloopScheduler?: boolean };
  if (g.__careloopScheduler) return; // guard against hot-reload double-start
  g.__careloopScheduler = true;

  if (process.env.VERCEL) {
    logger.info("In-process scheduler disabled on Vercel; Vercel Cron drives the daily round.");
    return;
  }

  const time = process.env.CARELOOP_CHECKIN_TIME; // e.g. "08:00"
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    logger.info("Scheduler off (set CARELOOP_CHECKIN_TIME=HH:MM to enable).");
    return;
  }
  const tz = process.env.CARELOOP_TZ ?? "Asia/Hong_Kong";

  let lastFiredDay = "";
  setInterval(async () => {
    const now = new Date();
    const hhmm = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz,
    });
    const day = now.toLocaleDateString("en-CA", { timeZone: tz });
    if (hhmm === time && lastFiredDay !== day) {
      lastFiredDay = day;
      try {
        const orgId = await getDefaultOrgId();
        const r = await sendDailyCheckInRound(orgId);
        logger.info("Scheduled daily check-in round complete.", {
          sent: r.sent,
          total: r.total,
        });
      } catch (err) {
        logger.error("Scheduled daily check-in round failed.", { err });
      }
    }
  }, 30_000);

  logger.info(`Daily check-in round scheduled at ${time} (${tz}).`);
}
