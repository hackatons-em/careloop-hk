import { buildCaregiverAlert } from "@/lib/caregiver";
import { getActiveAlert, getTimeline, recordAudit, updateAlert } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/caregiver-alert — build the bilingual caregiver alert
// (server-side, logged to the audit trail). Pass { notify_family: true } to also
// move the active alert to "family contacted".
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const timeline = await getTimeline(id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { notify_family?: boolean };
  const text = buildCaregiverAlert(
    timeline.patient,
    timeline.daily,
    timeline.checkins,
    timeline.risk.severity,
  );
  await recordAudit("caregiver_alert_generated", "nurse", "patient", id, {
    severity: timeline.risk.severity,
  });

  let alertStatus: string | null = null;
  if (body.notify_family) {
    const active = await getActiveAlert(id);
    if (active) {
      await updateAlert(active.id, { status: "family_contacted" }, "nurse");
      alertStatus = "family_contacted";
    }
  }

  return Response.json({ ...text, alert_status: alertStatus });
}
