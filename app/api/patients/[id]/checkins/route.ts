import { submitCheckIn, type CheckInInput } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/checkins — record a daily check-in, then re-evaluate risk
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as CheckInInput;
  const result = submitCheckIn(id, body, "patient");
  if (!result) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(result, { status: 201 });
}
