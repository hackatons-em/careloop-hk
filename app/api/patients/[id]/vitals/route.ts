import { addVital } from "@/lib/store";
import type { VitalType } from "@/lib/types";

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
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    type?: VitalType;
    value?: number;
    unit?: string;
    date?: string;
  };
  if (!body.type || typeof body.value !== "number") {
    return Response.json({ error: "type and numeric value are required" }, { status: 400 });
  }
  const risk = addVital(id, body.type, body.value, body.unit ?? DEFAULT_UNIT[body.type], body.date);
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ risk }, { status: 201 });
}
