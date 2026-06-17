import { requireAuth } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { getPatient, getWearableSamplesForDay } from "@/lib/store";
import { getLinkForPatient } from "@/lib/wearableLinks";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/wearable-today — today's raw intraday samples + the
// device connection status, for the live "Today" panel on the patient page.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;

  const patient = await getPatient(auth.ctx.orgId, id);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });

  const date = todayISO();
  const [samples, link] = await Promise.all([
    getWearableSamplesForDay(auth.ctx.orgId, id, date),
    getLinkForPatient(auth.ctx.orgId, id),
  ]);

  return Response.json({
    date,
    samples,
    connection: link
      ? {
          provider: link.provider,
          connected_at: link.connected_at,
          last_sync_at: link.last_sync_at,
        }
      : null,
  });
}
