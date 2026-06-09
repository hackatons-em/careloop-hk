// Shared-secret auth for the agent / cron endpoints (server-only).
//
// Callers must send `Authorization: Bearer <CRON_SECRET>` — Vercel Cron does
// this automatically for scheduled invocations. Comparison is timing-safe
// (SHA-256 digests + crypto.timingSafeEqual, which also hides length).
//
// FAIL-CLOSED IN PRODUCTION: when NODE_ENV=production and CRON_SECRET is not
// set, every request is rejected — an unset secret must never silently open
// patient-messaging endpoints. In local dev the endpoints stay open so the
// in-app trigger buttons work without setup.

import { createHash, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

export function requireCronAuthIfConfigured(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "CRON_SECRET is not configured — agent endpoints are disabled." },
        { status: 503 },
      );
    }
    return null; // local dev: open
  }
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (safeEqual(auth, expected)) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
