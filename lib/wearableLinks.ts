// Terra user ↔ patient mapping (server-only). Mirrors the phone-link helpers in
// lib/conversation.ts. A Terra user_id is globally unique, so (org_id,
// terra_user_id) is the key; a patient may hold several rows (one per provider).

import "server-only";
import { supa } from "./supabase";

export interface WearableLink {
  org_id: string;
  terra_user_id: string;
  provider: string;
  patient_id: string;
  reference_id: string | null;
  scopes: string | null;
  connected_at: string;
  last_sync_at: string | null;
}

/** The patient a Terra user is linked to in this org, or null. */
export async function getPatientForTerraUser(
  orgId: string,
  terraUserId: string,
): Promise<string | null> {
  const { data, error } = await supa()
    .from("careloop_wearable_links")
    .select("patient_id")
    .eq("org_id", orgId)
    .eq("terra_user_id", terraUserId)
    .maybeSingle();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.patient_id as string | undefined) ?? null;
}

/** Insert/update a Terra user → patient link (on the `auth` webhook). */
export async function linkTerraUser(opts: {
  orgId: string;
  patientId: string;
  terraUserId: string;
  provider?: string;
  referenceId?: string | null;
  scopes?: string | null;
}): Promise<void> {
  const { error } = await supa()
    .from("careloop_wearable_links")
    .upsert(
      {
        org_id: opts.orgId,
        terra_user_id: opts.terraUserId,
        provider: opts.provider ?? "",
        patient_id: opts.patientId,
        reference_id: opts.referenceId ?? null,
        scopes: opts.scopes ?? null,
        connected_at: new Date().toISOString(),
      },
      { onConflict: "org_id,terra_user_id" },
    );
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** Remove a link (on the `deauth` webhook). */
export async function unlinkTerraUser(orgId: string, terraUserId: string): Promise<void> {
  const { error } = await supa()
    .from("careloop_wearable_links")
    .delete()
    .eq("org_id", orgId)
    .eq("terra_user_id", terraUserId);
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** Stamp the most recent sync time for a Terra user (best-effort). */
export async function touchLastSync(orgId: string, terraUserId: string): Promise<void> {
  const { error } = await supa()
    .from("careloop_wearable_links")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("terra_user_id", terraUserId);
  if (error) throw new Error(`Supabase: ${error.message}`);
}

/** The newest wearable link for a patient (for the connection chip), or null. */
export async function getLinkForPatient(
  orgId: string,
  patientId: string,
): Promise<WearableLink | null> {
  const { data, error } = await supa()
    .from("careloop_wearable_links")
    .select("*")
    .eq("org_id", orgId)
    .eq("patient_id", patientId)
    .order("connected_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data?.[0] as WearableLink | undefined) ?? null;
}
