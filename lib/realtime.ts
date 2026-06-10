// Server-relayed realtime broadcast (server-only).
//
// The database is RLS deny-all, so browser table subscriptions receive
// nothing. Instead, API routes broadcast a content-free "something changed"
// ping over Supabase Realtime's REST endpoint after mutations; signed-in
// clients subscribed to their org topic react by refetching through the
// normal authenticated API. Payloads NEVER carry patient data — at most a
// severity word — so a guessed topic name leaks nothing.

import "server-only";
import { logger } from "./logger";

export type OrgRealtimeEvent = "alerts_changed" | "data_changed";

export async function broadcastOrgEvent(
  orgId: string,
  event: OrgRealtimeEvent,
  payload: { severity?: string } = {},
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic: `org-${orgId}`, event, payload, private: false }],
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      logger.warn("Realtime broadcast failed.", { status: res.status });
    }
  } catch (err) {
    // Best-effort by design: clients still have the polling fallback.
    logger.warn("Realtime broadcast errored.", { err });
  }
}
