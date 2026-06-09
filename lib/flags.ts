// Server-side feature flags. DEMO_MODE gates the demo tooling (reset, risky
// check-in replay, frozen demo clock) — set DEMO_MODE=true only on sales-demo
// deployments, never on a real hospital deployment.

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
