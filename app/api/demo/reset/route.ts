import { resetConversations } from "@/lib/conversation";
import { getPatientRows, resetDemo } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/demo/reset — restore deterministic seed data for a clean demo
export async function POST() {
  await resetDemo();
  await resetConversations();
  return Response.json({ ok: true, rows: await getPatientRows() });
}
