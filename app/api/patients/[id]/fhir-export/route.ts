import { requireAuth } from "@/lib/auth";
import { buildFhirBundle } from "@/lib/fhirService";
import { getTimeline, recordAudit } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/fhir-export  → FHIR-style Bundle JSON.
// Add ?download=1 to receive it as a downloadable .json attachment.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const timeline = await getTimeline(auth.ctx.orgId, id);
  if (!timeline) return Response.json({ error: "Patient not found" }, { status: 404 });

  const bundle = buildFhirBundle(timeline);
  await recordAudit(auth.ctx.orgId, "fhir_exported", auth.ctx.email, "patient", id, {});

  if (new URL(req.url).searchParams.get("download")) {
    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        "Content-Type": "application/fhir+json",
        "Content-Disposition": `attachment; filename="careloop-${id}-fhir.json"`,
      },
    });
  }
  return Response.json(bundle);
}
