import { requireAuth } from "@/lib/auth";
import { generateWeeklySummary } from "@/lib/summaryService";
import { getTimeline, saveWeeklySummary } from "@/lib/store";
import type { WeeklySummary } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/patients/:id/weekly-summary — deterministic summary, optionally
// reworded by Claude (falls back to the template if no key / on error).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const timeline = await getTimeline(auth.ctx.orgId, id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });

  const partial = await generateWeeklySummary(timeline);
  const summary: WeeklySummary = {
    id: `summary-${crypto.randomUUID()}`,
    patient_id: id,
    created_at: new Date().toISOString(),
    ...partial,
  };
  await saveWeeklySummary(auth.ctx.orgId, summary, auth.ctx.email);
  return Response.json(summary);
}
