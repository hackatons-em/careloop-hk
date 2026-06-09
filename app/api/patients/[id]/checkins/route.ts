import { requireAuth } from "@/lib/auth";
import { submitCheckIn } from "@/lib/store";
import { checkInInputSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/patients/:id/checkins — record a daily check-in, then re-evaluate risk
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const body = await parseBody(req, checkInInputSchema);
  if (!body.ok) return body.response;
  const result = await submitCheckIn(auth.ctx.orgId, id, body.data, auth.ctx.email);
  if (!result) return Response.json({ error: "Patient not found" }, { status: 404 });
  return Response.json(result, { status: 201 });
}
