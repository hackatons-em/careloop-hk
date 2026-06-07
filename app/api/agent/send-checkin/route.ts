import { sendDailyCheckIn } from "@/lib/agent";
import { requireCronAuthIfConfigured } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";

const DEFAULT_PATIENT = process.env.CARELOOP_WHATSAPP_PATIENT ?? "patient-mrs-chan";

// POST /api/agent/send-checkin — trigger the agent's outbound daily check-in for
// one patient (body { patientId }, defaults to the demo patient). Same action the
// scheduler runs; the demo uses it so you don't wait for the scheduled time.
export async function POST(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { patientId?: string };
  const patientId = body.patientId ?? DEFAULT_PATIENT;
  const result = await sendDailyCheckIn(patientId);
  if (!result.ok) {
    const status = result.error?.includes("phone") ? 400 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}

// GET /api/agent/send-checkin — Vercel Cron invokes scheduled jobs with GET (and
// sends `Authorization: Bearer <CRON_SECRET>` when configured). Sends the daily
// check-in to the default demo patient. Kept separate from POST so the in-app
// button (POST { patientId }) and the scheduler both work.
export async function GET(req: Request) {
  const denied = requireCronAuthIfConfigured(req);
  if (denied) return denied;
  const result = await sendDailyCheckIn(DEFAULT_PATIENT);
  if (!result.ok) {
    const status = result.error?.includes("phone") ? 400 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json(result);
}
