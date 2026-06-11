import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { runWeeklyDigest } from "@/lib/digest";
import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";
import { sweepSilence } from "@/lib/silence";
import { sweepAlertSlas } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Hobby ceiling — the combined sweep (silence + SLA + Monday digest) does
// per-patient work; give it headroom so a large ward doesn't time out.
export const maxDuration = 60;

// Each leg is isolated: a transient failure in one (or in one patient inside
// it) is logged and skipped, never aborting the remaining legs/patients. The
// per-patient isolation lives inside sweepSilence / runWeeklyDigest loops.
async function leg<T>(name: string, fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Sweep leg failed: ${name}`, { message });
    return { error: message };
  }
}

async function runSweeps(orgId: string, opts?: { withDigest?: boolean }) {
  const silence = await leg("silence", () => sweepSilence(orgId));
  const sla = await leg("sla", () => sweepAlertSlas(orgId));
  // The weekly family digest rides the same daily cron (Vercel Hobby allows
  // only two cron jobs) and fires on Mondays, HK time.
  const isMonday =
    new Date().toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: process.env.CARELOOP_TZ ?? "Asia/Hong_Kong",
    }) === "Mon";
  const digest = (opts?.withDigest ?? isMonday) ? await leg("digest", () => runWeeklyDigest(orgId)) : null;
  return { silence, sla, digest };
}

// GET /api/agent/sweep — Vercel Cron afternoon trigger (vercel.json): silence
// detection (NR rules + one re-prompt), the SLA escalation chain for
// unacknowledged alerts, and (Mondays) the weekly family digest.
// Bearer CRON_SECRET; fail-closed in production.
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const orgId = await getDefaultOrgId();
  const result = await runSweeps(orgId);
  logger.info("Afternoon sweep finished.", result as unknown as Record<string, unknown>);
  return Response.json(result);
}

// POST /api/agent/sweep — in-app manual trigger. Admin-only: a sweep can send
// outbound messages org-wide.
export async function POST(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  return Response.json(await runSweeps(auth.ctx.orgId, { withDigest: false }));
}
