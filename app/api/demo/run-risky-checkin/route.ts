import { runRiskyCheckIn } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/demo/run-risky-checkin — replay the canonical Mrs. Chan
// deterioration scenario (weight +2.3kg/3d, SOB, swelling, missed meds).
export async function POST() {
  const result = await runRiskyCheckIn();
  if (!result) return Response.json({ error: "Demo patient missing" }, { status: 500 });
  return Response.json(result, { status: 201 });
}
