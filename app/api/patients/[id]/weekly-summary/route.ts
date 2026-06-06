import { generateWeeklySummary } from "@/lib/summaryService";
import { getTimeline, saveWeeklySummary } from "@/lib/store";
import type { WeeklySummary } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/patients/:id/weekly-summary — deterministic summary, optionally
// reworded by Claude (falls back to the template if no key / on error).
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const timeline = getTimeline(id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });

  const partial = await generateWeeklySummary(timeline);
  const summary: WeeklySummary = {
    id: `summary-${crypto.randomUUID()}`,
    patient_id: id,
    created_at: new Date().toISOString(),
    ...partial,
  };
  saveWeeklySummary(summary);
  return Response.json(summary);
}
