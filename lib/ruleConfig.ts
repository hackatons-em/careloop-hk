// Per-org rule threshold configuration (server-only).
//
// Versioned, append-only: every save inserts a NEW (org_id, version) row, so
// the thresholds behind any historical alert are reconstructable (alerts
// stamp config_version). Version 0 = the code defaults in lib/riskEngine.ts.

import "server-only";
import { logger } from "./logger";
import { DEFAULT_RULE_CONFIG, type RuleConfig } from "./riskEngine";
import { supa } from "./supabase";

export interface ActiveRuleConfig {
  version: number;
  config: RuleConfig;
}

export interface RuleConfigVersion extends ActiveRuleConfig {
  created_by: string;
  note: string;
  created_at: string;
}

/** Latest config for the org; version 0 + defaults when never customized.
 * Read errors (e.g. migration 0008 not yet applied) degrade to the defaults —
 * a config-table problem must never stop risk evaluation. */
export async function getActiveRuleConfig(orgId: string): Promise<ActiveRuleConfig> {
  const { data, error } = await supa()
    .from("careloop_rule_config")
    .select("version, config")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logger.warn("Rule config read failed — using defaults.", { message: error.message });
    return { version: 0, config: { ...DEFAULT_RULE_CONFIG } };
  }
  if (!data) return { version: 0, config: { ...DEFAULT_RULE_CONFIG } };
  return {
    version: data.version as number,
    config: { ...DEFAULT_RULE_CONFIG, ...(data.config as Partial<RuleConfig>) },
  };
}

/** Full version history, newest first. Read errors degrade to empty. */
export async function getRuleConfigHistory(orgId: string): Promise<RuleConfigVersion[]> {
  const { data, error } = await supa()
    .from("careloop_rule_config")
    .select("*")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(20);
  if (error) {
    logger.warn("Rule config history read failed.", { message: error.message });
    return [];
  }
  return (data ?? []).map((r) => ({
    version: r.version as number,
    config: { ...DEFAULT_RULE_CONFIG, ...(r.config as Partial<RuleConfig>) },
    created_by: (r.created_by as string) ?? "",
    note: (r.note as string) ?? "",
    created_at: r.created_at as string,
  }));
}

/**
 * Append a new config version (full config stored, not a delta). Returns the
 * new active config. Concurrency: the (org_id, version) PK makes a racing
 * second save fail loudly rather than silently fork history.
 */
export async function saveRuleConfig(
  orgId: string,
  config: RuleConfig,
  actor: string,
  note: string,
): Promise<ActiveRuleConfig> {
  const current = await getActiveRuleConfig(orgId);
  const version = current.version + 1;
  const { error } = await supa()
    .from("careloop_rule_config")
    .insert({ org_id: orgId, version, config, created_by: actor, note });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return { version, config };
}
