import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";
import { sweepSilence } from "@/lib/silence";
import { sweepAlertSlas } from "@/lib/store";

export const dynamic = "force-dynamic";

async function runSweeps(orgId: string) {
  const silence = await sweepSilence(orgId);
  const sla = await sweepAlertSlas(orgId);
  return { silence, sla };
}

// GET /api/agent/sweep — Vercel Cron afternoon trigger (vercel.json): silence
// detection (NR rules + one re-prompt) and the SLA escalation chain for
// unacknowledged alerts. Bearer CRON_SECRET; fail-closed in production.
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const orgId = await getDefaultOrgId();
  const result = await runSweeps(orgId);
  logger.info("Afternoon sweep finished.", result as unknown as Record<string, unknown>);
  return Response.json(result);
}

// POST /api/agent/sweep — in-app manual trigger (signed-in users).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  return Response.json(await runSweeps(auth.ctx.orgId));
}
