-- CareLoop — multi-tenancy + authentication (production hardening).
--
-- 1. careloop_organizations: one row per hospital/institution. A single
--    "default" org is seeded so existing single-org deployments keep working;
--    the server resolves it for orgless entry points (WhatsApp webhook, cron).
-- 2. careloop_profiles: app-level user record linked 1:1 to auth.users with a
--    role ('admin' | 'nurse') and an org. Auth itself is Supabase Auth.
-- 3. org_id on ALL careloop tables, backfilled to the default org, NOT NULL.
-- 4. careloop_patients gains status / phone / created_at for the production
--    onboarding flows (nurse-created vs WhatsApp auto-created pending review).
-- 5. The global truncate RPCs are REPLACED by an org-scoped reset (the old
--    functions could wipe every tenant at once). lib/store.ts is updated in
--    the same release — do not apply this migration to a deployment running
--    older app code.

-- ---- organizations ---------------------------------------------------------

create table if not exists careloop_organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one default org.
create unique index if not exists careloop_orgs_one_default
  on careloop_organizations (is_default)
  where is_default;

insert into careloop_organizations (name, is_default)
select 'Default Organization', true
where not exists (select 1 from careloop_organizations where is_default);

-- ---- profiles (auth.users <-> org + role) ----------------------------------

create table if not exists careloop_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references careloop_organizations(id),
  role       text not null check (role in ('admin', 'nurse')),
  name       text not null default '',
  email      text not null,
  created_at timestamptz not null default now()
);
create index if not exists careloop_profiles_org_idx on careloop_profiles (org_id);

-- ---- patients: production columns -------------------------------------------

alter table careloop_patients add column if not exists status text not null default 'active';
alter table careloop_patients drop constraint if exists careloop_patients_status_check;
alter table careloop_patients add constraint careloop_patients_status_check
  check (status in ('active', 'pending_review', 'archived'));
alter table careloop_patients add column if not exists phone text;
alter table careloop_patients add column if not exists created_at timestamptz not null default now();

-- ---- org_id on every careloop table ------------------------------------------

do $$
declare
  default_org uuid;
  t text;
begin
  select id into default_org from careloop_organizations where is_default;

  foreach t in array array[
    'careloop_patients', 'careloop_vitals', 'careloop_checkins',
    'careloop_alerts', 'careloop_audit_events', 'careloop_summaries',
    'careloop_links', 'careloop_sessions', 'careloop_messages'
  ] loop
    execute format('alter table %I add column if not exists org_id uuid', t);
    execute format('update %I set org_id = $1 where org_id is null', t) using default_org;
    execute format('alter table %I alter column org_id set not null', t);
    execute format('alter table %I drop constraint if exists %I', t, t || '_org_fk');
    execute format(
      'alter table %I add constraint %I foreign key (org_id) references careloop_organizations(id)',
      t, t || '_org_fk'
    );
  end loop;
end $$;

-- ---- links: per-org phone routing + duplicate-patient guard -----------------

-- A WhatsApp number maps to one patient PER ORGANIZATION (composite PK), so a
-- second org can never silently steal another org's phone link.
alter table careloop_links drop constraint if exists careloop_links_pkey;
alter table careloop_links add primary key (phone, org_id);

-- One patient per phone per org: closes the webhook race where two concurrent
-- first messages from a new number would both create a patient. The second
-- insert fails 23505 and the app re-reads the winner.
create unique index if not exists careloop_patients_org_phone
  on careloop_patients (org_id, phone)
  where phone is not null;

-- Sessions are keyed per org too. (Patient ids are globally unique via the
-- patients PK, so collisions can't occur today — this is defense in depth so
-- the upsert is org-correct by construction.)
alter table careloop_sessions drop constraint if exists careloop_sessions_pkey;
alter table careloop_sessions add primary key (patient_id, date, org_id);

-- Composite indexes for the hot org-scoped queries.
create index if not exists careloop_patients_org_idx      on careloop_patients (org_id, status);
create index if not exists careloop_vitals_org_idx        on careloop_vitals (org_id, patient_id);
create index if not exists careloop_checkins_org_idx      on careloop_checkins (org_id, patient_id);
create index if not exists careloop_alerts_org_idx        on careloop_alerts (org_id, created_at desc);
create index if not exists careloop_alerts_org_pt_idx     on careloop_alerts (org_id, patient_id);
create index if not exists careloop_audit_org_idx         on careloop_audit_events (org_id, created_at desc);
create index if not exists careloop_summaries_org_idx     on careloop_summaries (org_id, patient_id, created_at desc);
create index if not exists careloop_links_org_idx         on careloop_links (org_id);
create index if not exists careloop_sessions_org_idx      on careloop_sessions (org_id);
create index if not exists careloop_messages_org_idx      on careloop_messages (org_id, patient_id, created_at);

-- ---- replace global truncate RPCs with an org-scoped reset --------------------

drop function if exists careloop_truncate_core();
drop function if exists careloop_truncate_conversations();

-- Deletes ALL data for ONE organization (demo reset). FK-safe order: children
-- first, patients last. Service-role only.
create or replace function careloop_reset_org(p_org uuid) returns void
  language sql security definer set search_path = public as $$
  delete from careloop_messages     where org_id = p_org;
  delete from careloop_sessions     where org_id = p_org;
  delete from careloop_links        where org_id = p_org;
  delete from careloop_alerts       where org_id = p_org;
  delete from careloop_checkins     where org_id = p_org;
  delete from careloop_vitals       where org_id = p_org;
  delete from careloop_summaries    where org_id = p_org;
  delete from careloop_audit_events where org_id = p_org;
  delete from careloop_patients     where org_id = p_org;
$$;

revoke execute on function careloop_reset_org(uuid) from public, anon, authenticated;

-- ---- RLS: deny-all (service-role only), matching the existing tables ----------

alter table careloop_organizations enable row level security;
alter table careloop_profiles      enable row level security;
