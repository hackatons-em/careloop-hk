import { requireAuth } from "@/lib/auth";
import { getOrganization } from "@/lib/org";
import { renderProgramPdf } from "@/lib/programPdf";
import { getProgramMetrics, recordAudit } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/program/pdf — downloadable monthly program-outcomes report (admin).
export async function GET(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;

  const [metrics, org] = await Promise.all([
    getProgramMetrics(auth.ctx.orgId, 30),
    getOrganization(auth.ctx.orgId),
  ]);
  const buffer = await renderProgramPdf({
    orgName: org?.name ?? "—",
    metrics,
    generatedAt: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: process.env.CARELOOP_TZ ?? "Asia/Hong_Kong",
    }),
  });
  await recordAudit(auth.ctx.orgId, "pdf_exported", auth.ctx.email, "organization", auth.ctx.orgId, {
    kind: "program_outcomes",
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="careloop-program-outcomes.pdf"`,
    },
  });
}
