import { getPatient } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients/:id
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patient = await getPatient(id);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(patient);
}
