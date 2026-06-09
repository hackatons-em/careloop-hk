import { requireAuth } from "@/lib/auth";
import { getTimeline } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/timeline — vitals series, check-ins, risk + risk trend
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const timeline = await getTimeline(auth.ctx.orgId, id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(timeline);
}
