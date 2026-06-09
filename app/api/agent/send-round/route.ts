import { sendDailyCheckInRound } from "@/lib/agent";
import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";

export const dynamic = "force-dynamic";

// GET /api/agent/send-round — Vercel Cron daily trigger (vercel.json): message
// every patient with a known WhatsApp number. Bearer CRON_SECRET; fail-closed
// in production.
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const orgId = await getDefaultOrgId();
  const result = await sendDailyCheckInRound(orgId);
  logger.info("Daily check-in round finished.", { sent: result.sent, total: result.total });
  return Response.json(result);
}

// POST /api/agent/send-round — in-app trigger for the same round (signed-in users).
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const result = await sendDailyCheckInRound(auth.ctx.orgId);
  return Response.json(result);
}
