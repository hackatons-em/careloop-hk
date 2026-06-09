// Next.js instrumentation — runs once on server startup.
// Order matters: Sentry first (so later failures are captured), then env
// validation (fail fast on misconfiguration), then the self-hosted scheduler
// (no-ops on Vercel, where Vercel Cron drives the daily round).
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    (await import("./lib/env")).validateEnv();
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
