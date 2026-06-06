import { renderSummaryPdf } from "@/lib/pdf";
import { getLatestSummary, getTimeline, recordAudit } from "@/lib/store";
import { buildClinicianDraft, summaryStats } from "@/lib/summaryService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/patients/:id/pdf — downloadable weekly clinician PDF. Uses the most
// recent generated summary text if one exists, else the deterministic draft.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const timeline = await getTimeline(id);
  if (!timeline) return new Response("Patient not found", { status: 404 });

  const stats = summaryStats(timeline);
  const latest = await getLatestSummary(id);
  const narrative = latest?.generated_text ?? buildClinicianDraft(timeline, stats);
  const generatedBy = latest?.generated_by ?? "template";

  const buffer = await renderSummaryPdf({
    patient: timeline.patient,
    stats,
    narrative,
    generatedBy,
  });
  await recordAudit("pdf_exported", "nurse", "patient", id, {});

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="careloop-${id}-weekly-summary.pdf"`,
    },
  });
}
