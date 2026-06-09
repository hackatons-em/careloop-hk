import { requireDemoAdmin } from "@/lib/demoGate";
import { getPatientRows, resetDemo } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/demo/reset — restore deterministic seed data for a clean demo.
// Admin-only, DEMO_MODE-only. Wipes ONLY the caller's organization.
export async function POST(req: Request) {
  const gate = await requireDemoAdmin(req);
  if (gate.response) return gate.response;
  await resetDemo(gate.ctx.orgId, gate.ctx.email);
  return Response.json({ ok: true, rows: await getPatientRows(gate.ctx.orgId) });
}
