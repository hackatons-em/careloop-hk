// Org-level operational settings (server-only).
//
// Stored as JSONB on careloop_organizations.settings; this module owns the
// typed shape and defaults so a missing/partial JSON blob always resolves to
// a complete, safe configuration. Defaults are deliberately conservative:
// page on escalate only, with SLA windows wide enough for the daily sweep.

import "server-only";
import { supa } from "./supabase";

export interface OrgSettings {
  /** Ward duty inbox for alert paging. "" → fall back to LEADS_NOTIFY_EMAIL. */
  alerts_email: string;
  /** Second-step contact when an SLA breach goes unaddressed. "" → none. */
  admin_email: string;
  /** Minimum severity that triggers an outbound nurse notification. */
  notify_min_severity: "escalate" | "review_today";
  /** Minutes an escalate alert may sit unacknowledged before re-paging. */
  sla_ack_minutes_escalate: number;
  /** Minutes a review_today alert may sit unacknowledged before re-paging. */
  sla_ack_minutes_review: number;
}

export const ORG_SETTINGS_DEFAULTS: OrgSettings = {
  alerts_email: "",
  admin_email: "",
  notify_min_severity: "escalate",
  sla_ack_minutes_escalate: 240,
  sla_ack_minutes_review: 480,
};

export async function getOrgSettings(orgId: string): Promise<OrgSettings> {
  const { data, error } = await supa()
    .from("careloop_organizations")
    .select("settings")
    .eq("id", orgId)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  const stored = (data?.settings ?? {}) as Partial<OrgSettings>;
  return { ...ORG_SETTINGS_DEFAULTS, ...stored };
}

/** Merge a partial update into the stored settings; returns the full result. */
export async function updateOrgSettings(
  orgId: string,
  patch: Partial<OrgSettings>,
): Promise<OrgSettings> {
  const merged = { ...(await getOrgSettings(orgId)), ...patch };
  const { error } = await supa()
    .from("careloop_organizations")
    .update({ settings: merged })
    .eq("id", orgId);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return merged;
}
