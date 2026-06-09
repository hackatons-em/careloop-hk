import { requireAuth } from "@/lib/auth";
import { supa } from "@/lib/supabase";
import { leadPatchSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// PATCH /api/leads/:id — admin: move a lead through new → contacted → closed.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, leadPatchSchema);
  if (!body.ok) return body.response;

  const { data, error } = await supa()
    .from("careloop_leads")
    .update({ status: body.data.status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return Response.json({ error: "Could not update lead" }, { status: 500 });
  if (!data) return Response.json({ error: "Lead not found" }, { status: 404 });
  return Response.json(data);
}
