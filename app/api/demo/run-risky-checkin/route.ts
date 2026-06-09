import { requireDemoAdmin } from "@/lib/demoGate";
import { runRiskyCheckIn } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/demo/run-risky-checkin — replay the canonical Mrs. Chan
// deterioration scenario (weight +2.3kg/3d, SOB, swelling, missed meds).
// Admin-only, DEMO_MODE-only.
export async function POST(req: Request) {
  const gate = await requireDemoAdmin(req);
  if (gate.response) return gate.response;
  const result = await runRiskyCheckIn(gate.ctx.orgId);
  if (!result) return Response.json({ error: "Demo patient missing" }, { status: 500 });
  return Response.json(result, { status: 201 });
}
