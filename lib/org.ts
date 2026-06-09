// Organization resolution (server-only).
//
// CareLoop is multi-tenant ready: every careloop_* row carries an org_id. The
// current UX is single-org, so entry points that have no user session (the
// WhatsApp webhook, cron) resolve the seeded default organization. When real
// multi-org routing lands (e.g. per-org WhatsApp numbers), this is the one
// place to change.

import "server-only";
import { supa } from "./supabase";

let cachedDefaultOrg: string | null = null;

export async function getDefaultOrgId(): Promise<string> {
  if (cachedDefaultOrg) return cachedDefaultOrg;
  const { data, error } = await supa()
    .from("careloop_organizations")
    .select("id")
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  if (!data?.id) {
    throw new Error(
      "No default organization found — apply supabase/migrations/0003_orgs_auth.sql first.",
    );
  }
  cachedDefaultOrg = data.id as string;
  return cachedDefaultOrg;
}

export interface Organization {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supa()
    .from("careloop_organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data as Organization | null) ?? null;
}
