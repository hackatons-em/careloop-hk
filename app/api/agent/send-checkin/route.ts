import { sendDailyCheckIn } from "@/lib/agent";
import { requireAuth } from "@/lib/auth";
import { parseBody, sendCheckinSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/agent/send-checkin — in-app trigger: send the outbound daily
// check-in to ONE patient (body { patientId }). Requires a signed-in user.
// Unlike the daily round, this has NO "already contacted today" guard — a nurse
// pressing send wants the message to go out now.
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, sendCheckinSchema);
  if (!body.ok) return body.response;
  const patientId = body.data.patientId;
  if (!patientId) {
    return Response.json({ error: "patientId is required" }, { status: 400 });
  }
  const result = await sendDailyCheckIn(auth.ctx.orgId, patientId);
  if (!result.ok) {
    const status = result.error?.includes("phone") ? 400 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}
