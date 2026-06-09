import { requireAuth } from "@/lib/auth";
import { evaluatePatient } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/evaluate-risk — run the deterministic engine on demand
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const risk = await evaluatePatient(auth.ctx.orgId, id, auth.ctx.email);
  if (!risk) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(risk);
}
