// Twilio webhook signature validation (server-only).
//
// Implements Twilio's documented scheme: HMAC-SHA1 over the exact public
// webhook URL + the POST form parameters sorted by name (name and value
// concatenated), base64-encoded, compared timing-safe against the
// X-Twilio-Signature header.
//
// The URL is pinned via TWILIO_WEBHOOK_URL instead of being reconstructed from
// proxy headers (reconstruction behind Vercel's proxies is error-prone). It
// must match the URL registered in the Twilio console BYTE FOR BYTE.
//
// Enforcement: required when Twilio is configured in production. When
// TWILIO_AUTH_TOKEN or TWILIO_WEBHOOK_URL is unset outside production (local
// dev / sandbox tunnels), validation is skipped with a log line.

import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

function computeSignature(authToken: string, url: string, params: Record<string, string>): string {
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Validate an inbound Twilio webhook. Returns null when the request may
 * proceed, or a ready-made 403 Response.
 *
 * @param form the already-parsed form data (string fields only are signed)
 */
export function requireTwilioSignature(req: Request, form: FormData): Response | null {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
  const isProd = process.env.NODE_ENV === "production";

  if (!authToken || !webhookUrl) {
    if (isProd && authToken) {
      // Twilio configured but URL not pinned — refuse to run unvalidated in prod.
      logger.error("TWILIO_WEBHOOK_URL unset in production — rejecting inbound webhook.");
      return Response.json({ error: "Webhook not configured" }, { status: 403 });
    }
    logger.warn("Twilio signature validation skipped (TWILIO_AUTH_TOKEN/TWILIO_WEBHOOK_URL unset).");
    return null;
  }

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) {
    logger.warn("Inbound webhook missing X-Twilio-Signature — rejected.");
    return Response.json({ error: "Missing signature" }, { status: 403 });
  }

  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  const expected = computeSignature(authToken, webhookUrl, params);
  if (!safeEqual(signature, expected)) {
    logger.warn("Inbound webhook failed signature validation — rejected.", {
      url: webhookUrl,
    });
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }
  return null;
}

// Exported for unit tests.
export const __test = { computeSignature };
