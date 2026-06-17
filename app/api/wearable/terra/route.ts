import { logger } from "@/lib/logger";
import { getDefaultOrgId } from "@/lib/org";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getPatient, recordWearableData, stampWearableConsent } from "@/lib/store";
import { requireTerraSignature } from "@/lib/terra";
import { terraWebhookSchema } from "@/lib/validation";
import { normalizeTerraPayload } from "@/lib/wearableIngest";
import {
  getPatientForTerraUser,
  linkTerraUser,
  touchLastSync,
  unlinkTerraUser,
} from "@/lib/wearableLinks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const DATA_EVENTS = new Set(["body", "daily", "sleep", "activity"]);

// POST /api/wearable/terra — Terra aggregator webhook. Signature-verified over
// the RAW body; resolves the Terra user → patient and ingests vitals. Returns
// 2xx fast (Terra retries non-2xx). Auth/link events use reference_id (= our
// patient id, which we set when generating the connect widget session).
export async function POST(req: Request) {
  // Raw body FIRST — the signature is computed over it; req.json() would consume it.
  const raw = await req.text();
  const forged = requireTerraSignature(req, raw);
  if (forged) return forged;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = terraWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }
  const evt = parsed.data;
  const userId = evt.user?.user_id;

  const limited = await enforceRateLimit("wearable_webhook", userId ?? "terra");
  if (limited) return limited;

  // Single-org deployment: Terra user_ids are global and the webhook carries no
  // per-request org, so we resolve the default org. The auth-event trust
  // boundary (validating reference_id belongs to this org) relies on this
  // single-org invariant — revisit before enabling multi-org routing.
  const orgId = await getDefaultOrgId();

  try {
    if (evt.type === "auth" || evt.type === "user_reauth") {
      const patientId = evt.user?.reference_id ?? null;
      if (userId && patientId && (await getPatient(orgId, patientId))) {
        await linkTerraUser({
          orgId,
          patientId,
          terraUserId: userId,
          provider: evt.user?.provider ?? "",
          referenceId: patientId,
        });
        await stampWearableConsent(orgId, patientId);
      } else {
        logger.warn("Terra auth webhook with unknown reference_id — ignored.", { userId });
      }
      return Response.json({ ok: true });
    }

    if (evt.type === "deauth") {
      if (userId) await unlinkTerraUser(orgId, userId);
      return Response.json({ ok: true });
    }

    if (DATA_EVENTS.has(evt.type)) {
      if (!userId) return Response.json({ ok: true });
      const patientId = await getPatientForTerraUser(orgId, userId);
      // Data can arrive before the auth webhook is processed — ack and wait.
      if (!patientId) return Response.json({ ok: true });

      const { samples, rollup } = normalizeTerraPayload(evt.type, evt.data ?? []);
      await recordWearableData(orgId, patientId, evt.user?.provider ?? "", samples, rollup);
      await touchLastSync(orgId, userId);
      return Response.json({ ok: true });
    }

    if (evt.type === "large_request_processing" || evt.type === "large_request_sending") {
      // Historical backfill is delivered as a URL to fetch (not inline data).
      // Phase 1 ingests forward/live data only; backfill fetch-and-ingest is a
      // documented deferral. Logged so operators see it arrived.
      logger.info("Terra historical backfill received — deferred (Phase 1 live-only).", { userId });
      return Response.json({ ok: true });
    }

    // Unknown / unhandled event type — acknowledge so Terra doesn't retry.
    return Response.json({ ok: true });
  } catch (err) {
    logger.error("Wearable webhook processing failed.", {
      type: evt.type,
      err: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
