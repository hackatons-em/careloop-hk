import { requireAuth } from "@/lib/auth";
import { getPatient, updatePatient } from "@/lib/store";
import { parseBody, patientCreateSchema, patientUpdateSchema } from "@/lib/validation";
import type { Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/patients/:id
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const patient = await getPatient(auth.ctx.orgId, id);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(patient);
}

/** Activating a pending_review patient requires complete, plausible details —
 * a WhatsApp auto-created record (age 0, baselines 0, no conditions) must be
 * filled in by a nurse before the clinical rules can monitor it properly. */
function activationProblem(existing: Patient, patch: Record<string, unknown>): string | null {
  const merged = {
    name: existing.name,
    age: existing.age,
    gender: existing.gender || "other",
    language: existing.language,
    living_status: existing.living_status,
    conditions: existing.conditions,
    caregiver_name: existing.caregiver_name,
    caregiver_phone: existing.caregiver_phone,
    assigned_nurse: existing.assigned_nurse,
    baseline_weight: existing.baseline_weight,
    baseline_steps: existing.baseline_steps,
    phone: existing.phone,
    ...Object.fromEntries(Object.entries(patch).filter(([k]) => k !== "status")),
  };
  const check = patientCreateSchema.safeParse(merged);
  if (check.success) return null;
  const fields = [...new Set(check.error.issues.map((i) => String(i.path[0])))].join(", ");
  return `Complete the patient's details before activating (missing/invalid: ${fields}).`;
}

// PATCH /api/patients/:id — update details / status (e.g. mark reviewed)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, patientUpdateSchema);
  if (!body.ok) return body.response;

  if (body.data.status === "active") {
    const existing = await getPatient(auth.ctx.orgId, id);
    if (!existing) return Response.json({ error: "Patient not found" }, { status: 404 });
    if (existing.status === "pending_review") {
      const problem = activationProblem(existing, body.data);
      if (problem) return Response.json({ error: problem }, { status: 400 });
    }
  }

  const patient = await updatePatient(auth.ctx.orgId, id, body.data, auth.ctx.email);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(patient);
}

// DELETE /api/patients/:id — soft delete (archive); history is preserved
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const patient = await updatePatient(auth.ctx.orgId, id, { status: "archived" }, auth.ctx.email);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ ok: true, patient });
}
