// Optional shared secret for the agent / cron endpoints (server-only).
//
// When CRON_SECRET is set, callers must send `Authorization: Bearer <CRON_SECRET>`
// — Vercel Cron does this automatically for scheduled invocations. When it is
// unset (local dev / the judge demo), the endpoints stay open so the in-app
// trigger buttons keep working. Returns a 401 Response to short-circuit the
// handler, or null when the request may proceed.

export function requireCronAuthIfConfigured(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
