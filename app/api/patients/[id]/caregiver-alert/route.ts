import { requireAuth } from "@/lib/auth";
import { buildCaregiverAlert } from "@/lib/caregiver";
import { getActiveAlert, getTimeline, recordAudit, updateAlert } from "@/lib/store";
import { caregiverAlertSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/caregiver-alert — build the bilingual caregiver alert
// (server-side, logged to the audit trail). Pass { notify_family: true } to also
// move the active alert to "family contacted".
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const timeline = await getTimeline(auth.ctx.orgId, id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });

  const body = await parseBody(req, caregiverAlertSchema);
  if (!body.ok) return body.response;
  const text = buildCaregiverAlert(
    timeline.patient,
    timeline.daily,
    timeline.checkins,
    timeline.risk.severity,
  );
  await recordAudit(auth.ctx.orgId, "caregiver_alert_generated", auth.ctx.email, "patient", id, {
    severity: timeline.risk.severity,
  });

  let alertStatus: string | null = null;
  if (body.data.notify_family) {
    const active = await getActiveAlert(auth.ctx.orgId, id);
    if (active) {
      await updateAlert(auth.ctx.orgId, active.id, { status: "family_contacted" }, auth.ctx.email);
      alertStatus = "family_contacted";
    }
  }

  return Response.json({ ...text, alert_status: alertStatus });
}
