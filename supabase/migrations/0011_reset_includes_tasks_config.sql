-- Make the demo reset clean + deterministic.
--
-- careloop_reset_org (migration 0003) predates careloop_tasks (0007) and
-- careloop_rule_config (0008), so neither was wiped on reset:
--  - orphaned tasks survived (no FK to patients), re-surfacing on the dashboard
--    lane with a dead patient link;
--  - a customized rule-config version survived, so reseeded alerts were
--    evaluated/stamped against non-default thresholds — breaking the documented
--    "known demo state" (the seed dataset only yields its documented severities
--    under the code-default thresholds).
-- Redefine the function to also clear both, returning the org to config v0 /
-- code defaults on every reset.

create or replace function careloop_reset_org(p_org uuid) returns void
  language sql security definer set search_path = public as $$
  delete from careloop_messages     where org_id = p_org;
  delete from careloop_sessions     where org_id = p_org;
  delete from careloop_links        where org_id = p_org;
  delete from careloop_tasks        where org_id = p_org;
  delete from careloop_alerts       where org_id = p_org;
  delete from careloop_checkins     where org_id = p_org;
  delete from careloop_vitals       where org_id = p_org;
  delete from careloop_summaries    where org_id = p_org;
  delete from careloop_rule_config  where org_id = p_org;
  delete from careloop_audit_events where org_id = p_org;
  delete from careloop_patients     where org_id = p_org;
$$;

revoke execute on function careloop_reset_org(uuid) from public, anon, authenticated;
