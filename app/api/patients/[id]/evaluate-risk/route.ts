import { evaluatePatient } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/evaluate-risk — run the deterministic engine on demand
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const risk = evaluatePatient(id);
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(risk);
}
