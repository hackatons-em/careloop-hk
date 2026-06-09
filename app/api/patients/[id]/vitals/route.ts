import { requireAuth } from "@/lib/auth";
import { addVital } from "@/lib/store";
import type { VitalType } from "@/lib/types";
import { parseBody, vitalInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const DEFAULT_UNIT: Record<VitalType, string> = {
  weight: "kg",
  blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg",
  heart_rate: "bpm",
  steps: "steps",
  sleep_hours: "h",
};

// POST /api/patients/:id/vitals — add a vital reading, then re-evaluate risk
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, vitalInputSchema);
  if (!body.ok) return body.response;
  const { type, value, unit, date } = body.data;
  const risk = await addVital(auth.ctx.orgId, id, type, value, unit ?? DEFAULT_UNIT[type], date);
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ risk }, { status: 201 });
}
