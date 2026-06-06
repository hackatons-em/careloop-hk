import { getTimeline } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/timeline — vitals series, check-ins, risk + risk trend
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const timeline = await getTimeline(id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(timeline);
}
