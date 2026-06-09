// Rate limiting (server-only). Uses Upstash Redis when configured (correct
// across serverless instances); otherwise falls back to a per-instance
// in-memory sliding window — fine for dev/self-host, weak on serverless, which
// lib/env.ts warns about at boot.

import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterName = "webhook" | "api" | "auth" | "leads";

const LIMITS: Record<LimiterName, { tokens: number; windowSeconds: number }> = {
  webhook: { tokens: 30, windowSeconds: 60 }, // per phone number
  api: { tokens: 240, windowSeconds: 60 }, // per user (dashboard polls several endpoints)
  auth: { tokens: 10, windowSeconds: 60 }, // per IP (invites, sensitive admin ops)
  leads: { tokens: 5, windowSeconds: 3600 }, // per IP — public contact form
};

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

const upstashLimiters = new Map<LimiterName, Ratelimit>();

function upstashLimiter(name: LimiterName): Ratelimit {
  let limiter = upstashLimiters.get(name);
  if (!limiter) {
    const { tokens, windowSeconds } = LIMITS[name];
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(tokens, `${windowSeconds} s`),
      prefix: `careloop:rl:${name}`,
    });
    upstashLimiters.set(name, limiter);
  }
  return limiter;
}

// --- in-memory fallback (per instance) --------------------------------------

// Hard cap so an attacker generating unique keys (spoofed IPs / phone numbers)
// can't exhaust memory on long-lived self-hosted processes. FIFO eviction —
// Map preserves insertion order, so the first key is the oldest.
const MAX_KEYS = 10_000;

const memory = new Map<string, number[]>();
let lastSweep = 0;

function memoryAllow(name: LimiterName, key: string): boolean {
  const { tokens, windowSeconds } = LIMITS[name];
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Periodic sweep so abandoned keys don't accumulate.
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, stamps] of memory) {
      const alive = stamps.filter((t) => now - t < windowMs);
      if (alive.length === 0) memory.delete(k);
      else memory.set(k, alive);
    }
  }

  const id = `${name}:${key}`;
  if (!memory.has(id) && memory.size >= MAX_KEYS) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }

  const stamps = (memory.get(id) ?? []).filter((t) => now - t < windowMs);
  if (stamps.length >= tokens) {
    memory.set(id, stamps);
    return false;
  }
  stamps.push(now);
  memory.set(id, stamps);
  return true;
}

// --- public API ---------------------------------------------------------------

/** True when the request is allowed; false when rate-limited. */
export async function rateLimitAllow(name: LimiterName, key: string): Promise<boolean> {
  if (upstashConfigured()) {
    const { success } = await upstashLimiter(name).limit(key);
    return success;
  }
  return memoryAllow(name, key);
}

/** Convenience: returns a ready-made 429 when limited, else null. */
export async function enforceRateLimit(name: LimiterName, key: string): Promise<Response | null> {
  if (await rateLimitAllow(name, key)) return null;
  return Response.json({ error: "Too many requests" }, { status: 429 });
}

/** Best-effort client IP for per-IP limits (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
