import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { runWeeklyDigest } from "@/lib/digest";
import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";
import { sweepSilence } from "@/lib/silence";
import { sweepAlertSlas } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function runSweeps(orgId: string, opts?: { withDigest?: boolean }) {
  const silence = await sweepSilence(orgId);
  const sla = await sweepAlertSlas(orgId);
  // The weekly family digest rides the same daily cron (Vercel Hobby allows
  // only two cron jobs) and fires on Mondays, HK time.
  const isMonday =
    new Date().toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: process.env.CARELOOP_TZ ?? "Asia/Hong_Kong",
    }) === "Mon";
  const digest = (opts?.withDigest ?? isMonday) ? await runWeeklyDigest(orgId) : null;
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
