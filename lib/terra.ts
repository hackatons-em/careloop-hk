// Terra wearable-aggregator client + webhook signature verification (server-only).
//
// Terra normalizes data from 500+ wearables/apps and pushes it to our webhook.
// We use two surfaces:
//   - generateWidgetSession: returns a hosted URL the patient opens to connect
//     their device (browser OAuth). `reference_id` carries OUR patient id so the
//     subsequent `auth` webhook tells us which patient connected.
//   - requireTerraSignature: verifies the `terra-signature` header (HMAC-SHA256
//     over `${t}.${rawBody}`) — mirrors lib/twilioSig.ts. Fail-closed in prod.

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

const TERRA_BASE = "https://api.tryterra.co/v2";

// Phase 1: cloud providers that connect via browser OAuth (NO companion app).
// Apple Health (Apple Watch) + Health Connect (Samsung/Wear OS) need the mobile
// SDK — added in Phase 2 — so they are deliberately excluded here.
export const PHASE1_PROVIDERS = "GARMIN,FITBIT,OURA,WITHINGS,POLAR,SUUNTO,WHOOP,GOOGLE";

export function terraConfigured(): boolean {
  return Boolean(process.env.TERRA_DEV_ID && process.env.TERRA_API_KEY);
}

function parseSignatureHeader(header: string): { t: string; v1: string } | null {
  let t = "";
  let v1 = "";
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "t") t = val;
    else if (key === "v1") v1 = val;
  }
  if (!t || !v1) return null;
  return { t, v1 };
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf-8");
  const bb = Buffer.from(b, "utf-8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function computeSignature(secret: string, t: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf-8").digest("hex");
}

/**
 * Verify an inbound Terra webhook against the RAW request body. Returns null to
 * proceed, or a ready-made 403 Response. Fail-closed in production when Terra is
 * configured; skipped (logged) when the signing secret is unset outside
 * production (local tunnels).
 */
export function requireTerraSignature(req: Request, rawBody: string): Response | null {
  const secret = process.env.TERRA_SIGNING_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd && terraConfigured()) {
      logger.error("TERRA_SIGNING_SECRET unset in production — rejecting wearable webhook.");
      return Response.json({ error: "Webhook not configured" }, { status: 403 });
    }
    logger.warn("Terra signature validation skipped (TERRA_SIGNING_SECRET unset).");
    return null;
  }

  const header = req.headers.get("terra-signature");
  if (!header) {
    logger.warn("Wearable webhook missing terra-signature — rejected.");
    return Response.json({ error: "Missing signature" }, { status: 403 });
  }
  const parsed = parseSignatureHeader(header);
  if (!parsed) {
    logger.warn("Wearable webhook malformed terra-signature — rejected.");
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }
  const expected = computeSignature(secret, parsed.t, rawBody);
  if (!safeEqual(parsed.v1, expected)) {
    logger.warn("Wearable webhook failed signature validation — rejected.");
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  // Replay guard: reject deliveries whose signed timestamp is far from now.
  // Wide (24h) so a multi-hour provider outage + retry is never rejected (Terra
  // replays the original signed timestamp on retry), while still blocking ancient
  // replays. Skipped entirely if `t` is not a parseable unix time, so a format
  // change never silently drops live data.
  let tSec = Number(parsed.t);
  if (Number.isFinite(tSec) && tSec > 0) {
    if (tSec > 1e12) tSec /= 1000; // tolerate a milliseconds timestamp
    if (Math.abs(Date.now() / 1000 - tSec) > 86_400) {
      logger.warn("Wearable webhook timestamp outside tolerance — rejected.");
      return Response.json({ error: "Stale signature" }, { status: 403 });
    }
  }
  return null;
}

export interface WidgetSession {
  url: string;
  session_id: string;
  expires_in: number;
}

/** Create a Terra connect-widget session. `referenceId` = our patient id. */
export async function generateWidgetSession(opts: {
  referenceId: string;
  providers?: string;
  language?: string;
  successUrl?: string;
  failureUrl?: string;
}): Promise<WidgetSession> {
  const devId = process.env.TERRA_DEV_ID;
  const apiKey = process.env.TERRA_API_KEY;
  if (!devId || !apiKey) throw new Error("Terra is not configured");

  const res = await fetch(`${TERRA_BASE}/auth/generateWidgetSession`, {
    method: "POST",
    headers: {
      "dev-id": devId,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: opts.referenceId,
      providers: opts.providers ?? PHASE1_PROVIDERS,
      language: opts.language ?? "en",
      auth_success_redirect_url: opts.successUrl,
      auth_failure_redirect_url: opts.failureUrl,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Terra widget session failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as Partial<WidgetSession>;
  if (!json.url) throw new Error("Terra widget session returned no url");
  return { url: json.url, session_id: json.session_id ?? "", expires_in: json.expires_in ?? 0 };
}

// Exported for unit tests.
export const __test = { computeSignature, parseSignatureHeader };
