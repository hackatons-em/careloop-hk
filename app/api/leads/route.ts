import { requireAuth } from "@/lib/auth";
import { sendLeadNotification } from "@/lib/email";
import { logger } from "@/lib/logger";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";
import { supa } from "@/lib/supabase";
import { leadSchema, parseBody } from "@/lib/validation";

export const dynamic = "force-dynamic";

// POST /api/leads — public demo-request / contact form. Rate-limited per IP;
// hidden honeypot field gets a silent success (don't teach bots).
export async function POST(req: Request) {
  const limited = await enforceRateLimit("leads", clientIp(req));
  if (limited) return limited;

  const body = await parseBody(req, leadSchema);
  if (!body.ok) return body.response;

  if (body.data.website) {
    logger.info("Lead honeypot tripped.", { ip: clientIp(req) });
    return Response.json({ ok: true }, { status: 201 });
  }

  // Strip the honeypot field before persisting.
  const { website, ...lead } = body.data;
  void website;
  const { data, error } = await supa()
    .from("careloop_leads")
    .insert(lead)
    .select("id")
    .single();
  if (error) {
    logger.error("Lead insert failed.", { err: error.message });
    return Response.json({ error: "Could not save your request" }, { status: 500 });
  }

  await sendLeadNotification(lead);
  logger.info("Lead captured.", { id: data.id, interest: lead.interest });
  return Response.json({ ok: true }, { status: 201 });
}

// GET /api/leads — admin: newest 200 leads.
export async function GET(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  const { data, error } = await supa()
    .from("careloop_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    logger.error("Lead list failed.", { err: error.message });
    return Response.json({ error: "Could not load leads" }, { status: 500 });
  }
  return Response.json(data ?? []);
}
