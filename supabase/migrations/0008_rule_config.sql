-- Per-org rule threshold configuration — versioned, append-only.
--
-- Rule STRUCTURE stays in code (ENGINE_VERSION); only numeric thresholds are
-- tunable, inside guardrailed bounds enforced by the app. Every change is a
-- NEW version row (never an update), so the exact thresholds behind any
-- historical alert are reconstructable: alerts stamp config_version.
-- Version 0 (no rows) = the code defaults.

create table if not exists careloop_rule_config (
  org_id     uuid not null references careloop_organizations(id),
  version    integer not null,
  config     jsonb not null,
  created_by text not null default '',
  note       text not null default '',
  created_at timestamptz not null default now(),
  primary key (org_id, version)
);

alter table careloop_rule_config enable row level security;

alter table careloop_alerts
  add column if not exists config_version integer;
