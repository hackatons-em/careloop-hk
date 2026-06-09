import { requireAuth } from "@/lib/auth";
import { getThread } from "@/lib/conversation";
import { getPatient } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/patients/:id/messages — the WhatsApp conversation thread (inbound +
// outbound), with the symptom extraction per inbound message. Polled by the
// conversation panel for a live view.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const patient = await getPatient(auth.ctx.orgId, id);
  if (!patient) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json({ messages: await getThread(auth.ctx.orgId, id) });
}
