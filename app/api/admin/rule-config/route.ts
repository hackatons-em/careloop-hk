import { requireAuth } from "@/lib/auth";
import { getActiveRuleConfig, getRuleConfigHistory, saveRuleConfig } from "@/lib/ruleConfig";
import { recordAudit } from "@/lib/store";
import { parseBody, ruleConfigSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/rule-config — active thresholds + version history (admin).
export async function GET(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  const [active, history] = await Promise.all([
    getActiveRuleConfig(auth.ctx.orgId),
    getRuleConfigHistory(auth.ctx.orgId),
  ]);
  return Response.json({ active, history });
}

// POST /api/admin/rule-config — append a new threshold version (admin).
// Guardrailed by ruleConfigSchema; every change is audited and versioned.
export async function POST(req: Request) {
  const auth = await requireAuth(req, "admin");
  if (auth.response) return auth.response;
  const body = await parseBody(req, ruleConfigSchema);
  if (!body.ok) return body.response;

  const { note, ...config } = body.data;
  const saved = await saveRuleConfig(auth.ctx.orgId, config, auth.ctx.email, note);
  await recordAudit(auth.ctx.orgId, "rule_config_updated", auth.ctx.email, "organization", auth.ctx.orgId, {
    version: saved.version,
    note,
    config,
  });
  return Response.json(saved);
}
