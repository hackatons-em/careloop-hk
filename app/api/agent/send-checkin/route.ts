import { sendDailyCheckIn } from "@/lib/agent";
import { requireAuth } from "@/lib/auth";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";
import { getDefaultOrgId } from "@/lib/org";
import { parseBody, sendCheckinSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = process.env.CARELOOP_WHATSAPP_PATIENT ?? "patient-mrs-chan";

// POST /api/agent/send-checkin — in-app trigger: send the outbound daily
// check-in to one patient (body { patientId }). Requires a signed-in user.
// Unlike the daily round, this has NO "already contacted today" guard — a nurse
// pressing send wants the message to go out now.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, sendCheckinSchema);
  if (!body.ok) return body.response;
  const patientId = body.data.patientId ?? DEFAULT_PATIENT;
  const result = await sendDailyCheckIn(auth.ctx.orgId, patientId);
  if (!result.ok) {
    const status = result.error?.includes("phone") ? 400 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}

// GET /api/agent/send-checkin — DEPRECATED cron target (kept one release so an
// old vercel.json cron firing mid-deploy doesn't 404). The production cron now
// hits GET /api/agent/send-round. Sends to the default demo patient only.
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const orgId = await getDefaultOrgId();
  const result = await sendDailyCheckIn(orgId, DEFAULT_PATIENT);
  if (!result.ok) {
    const status = result.error?.includes("phone") ? 400 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}
