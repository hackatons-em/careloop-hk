-- Alert lifecycle timestamps + engine versioning.
--
-- acknowledged_at / resolved_at: set on the first transition out of "new" /
-- into "resolved" — the keystone columns for time-to-acknowledge analytics
-- and SLA timers (a nurse jumping straight to family_contacted still counts
-- as acknowledgement).
-- last_notified_at: notification dedupe — the SLA sweep re-pages only when
-- the unacked window has elapsed since this stamp, not on every sweep tick.
-- engine_version: which version of the deterministic rule engine produced the
-- alert's matched_rules/severity, so historical alerts stay auditable after
-- rule changes (rules are versioned, never silently rewritten).

alter table careloop_alerts
  add column if not exists acknowledged_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists last_notified_at timestamptz,
  add column if not exists engine_version text;
