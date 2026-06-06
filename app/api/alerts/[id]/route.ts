import { updateAlert, type AlertPatch } from "@/lib/store";

export const dynamic = "force-dynamic";

// PATCH /api/alerts/:id — acknowledge / change status / add nurse note
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as AlertPatch & { actor?: string };
  const alert = await updateAlert(id, { status: body.status, nurse_note: body.nurse_note }, body.actor);
  if (!alert) return Response.json({ error: "Alert not found" }, { status: 404 });
  return Response.json(alert);
}
