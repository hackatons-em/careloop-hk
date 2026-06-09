import { requireAuth } from "@/lib/auth";
import { createPatient, getPatientRows } from "@/lib/store";
import { parseBody, patientCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/patients — dashboard rows (patient + deterministic risk + status)
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  return Response.json(await getPatientRows(auth.ctx.orgId));
}

// POST /api/patients — create a patient (nurse-managed onboarding)
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const body = await parseBody(req, patientCreateSchema);
  if (!body.ok) return body.response;
  const patient = await createPatient(auth.ctx.orgId, body.data, auth.ctx.email);
  return Response.json(patient, { status: 201 });
}
