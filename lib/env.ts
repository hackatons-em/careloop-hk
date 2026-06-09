// Startup-time environment validation. Called from instrumentation.ts
// register() ONLY — never at module import time, which would break `next build`
// (no env in CI) and vitest.
//
// Required vars fail fast in production; in dev/test they log a warning so the
// app can still boot in degraded mode. Optional integration groups produce one
// informational line each so operators can see at a glance what is enabled.

import { z } from "zod";
import { logger } from "./logger";

const requiredSchema = z.object({
  SUPABASE_URL: z.string().url({ message: "SUPABASE_URL must be a URL" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const optionalFormatSchema = z.object({
  CARELOOP_CHECKIN_TIME: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "CARELOOP_CHECKIN_TIME must be HH:MM")
    .optional()
    .or(z.literal("")),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().or(z.literal("")),
  TWILIO_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
});

export function validateEnv(): void {
  // Never validate during the build phase — env is injected at runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const isProd = process.env.NODE_ENV === "production";

  const required = requiredSchema.safeParse(process.env);
  if (!required.success) {
    const missing = required.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const msg = `Environment misconfigured — ${missing}`;
    if (isProd) throw new Error(msg);
    logger.warn(`${msg} (continuing in dev/test degraded mode)`);
  }

  const optional = optionalFormatSchema.safeParse(process.env);
  if (!optional.success) {
    const bad = optional.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const msg = `Optional env has invalid format — ${bad}`;
    if (isProd) throw new Error(msg);
    logger.warn(msg);
  }

  // Informational: which optional integrations are active.
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.info("ANTHROPIC_API_KEY unset — AI wording disabled, deterministic templates used.");
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    logger.info("Twilio unset — outbound WhatsApp disabled.");
  } else if (!process.env.TWILIO_WEBHOOK_URL) {
    logger.warn(
      "TWILIO_WEBHOOK_URL unset — inbound webhook signature validation disabled. Set it to the exact public webhook URL in production.",
    );
  }
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    logger.info("No STT key (GROQ_API_KEY / OPENAI_API_KEY) — voice notes use pinned fallback.");
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    const note = "Upstash unset — rate limiting uses per-instance in-memory fallback.";
    if (isProd) logger.warn(note);
    else logger.info(note);
  }
  if (isProd && !process.env.CRON_SECRET) {
    logger.warn("CRON_SECRET unset — agent endpoints reject all requests in production (fail-closed).");
  }
  if (!process.env.SENTRY_DSN) {
    logger.info("SENTRY_DSN unset — error tracking disabled.");
  }
  if (!process.env.RESEND_API_KEY || !process.env.LEADS_NOTIFY_EMAIL) {
    logger.info(
      "RESEND_API_KEY/LEADS_NOTIFY_EMAIL unset — leads stored in DB only, no email notification.",
    );
  }
  if (process.env.DEMO_MODE === "true") {
    logger.warn("DEMO_MODE enabled — demo tooling active and clock frozen to the demo week. Do not use for real patients.");
  }
}
