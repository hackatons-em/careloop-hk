// Gate for the /api/demo/* endpoints: DEMO_MODE must be enabled AND the caller
// must be an authenticated admin. Demo tooling can truncate and rewrite an
// org's data — it must never be reachable on a real hospital deployment.

import "server-only";
import { requireAuth, type AuthContext } from "./auth";
import { isDemoMode } from "./flags";

export type DemoGateResult =
  | { ctx: AuthContext; response?: never }
  | { ctx?: never; response: Response };

export async function requireDemoAdmin(req: Request): Promise<DemoGateResult> {
  if (!isDemoMode()) {
    return {
      response: Response.json({ error: "Demo mode is disabled" }, { status: 404 }),
    };
  }
  return requireAuth(req, "admin");
}
