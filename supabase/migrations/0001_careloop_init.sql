-- CareLoop — Supabase schema (core data layer + WhatsApp conversation layer).
-- Conversation tables follow the agreed reference (read.txt): careloop_links /
-- careloop_sessions / careloop_messages. Core tables use the same careloop_
-- prefix for consistency + collision-safety. The server accesses everything with
-- the service-role key (bypasses RLS); RLS is enabled with no public policies so
-- the anon/publishable key can never read or write. All ids are app-generated.

-- ---- core ----------------------------------------------------------------

create table if not exists careloop_patients (
  id              text primary key,
  name            text not null,
  age             int not null,
  gender          text not null,
  language        text not null,
  living_status   text not null,
  conditions      text[] not null default '{}',
  caregiver_name  text not null,
  caregiver_phone text not null,
  assigned_nurse  text not null,
  baseline_weight numeric not null,
  baseline_steps  int not null
);

create table if not exists careloop_vitals (
  id         text primary key,
  patient_id text not null references careloop_patients(id) on delete cascade,
  ts         timestamptz not null,
  type       text not null,
  value      numeric not null,
  unit       text not null,
  source     text not null
);
create index if not exists careloop_vitals_patient_idx on careloop_vitals (patient_id);
create index if not exists careloop_vitals_pt_idx on careloop_vitals (patient_id, type, ts);

create table if not exists careloop_checkins (
  id                  text primary key,
  patient_id          text not null references careloop_patients(id) on delete cascade,
  date                date not null,
  mood                text not null default '',
  shortness_of_breath boolean not null default false,
  swelling            boolean not null default false,
  dizziness           boolean not null default false,
  chest_discomfort    boolean not null default false,
  medication_taken    boolean not null default true,
  free_text_note      text,
  source              text not null,
  unique (patient_id, date)
);
create index if not exists careloop_checkins_patient_idx on careloop_checkins (patient_id);

create table if not exists careloop_alerts (
  id                  text primary key,
  patient_id          text not null references careloop_patients(id) on delete cascade,
  created_at          timestamptz not null default now(),
  severity            text not null,
  matched_rules       text[] not null default '{}',
  reason              text not null,
  recommended_action  text not null,
  status              text not null,
  assigned_to         text not null,
  nurse_note          text
);
create index if not exists careloop_alerts_patient_idx on careloop_alerts (patient_id);

create table if not exists careloop_audit_events (
  id          text primary key,
  actor       text not null,
  action      text not null,
  target_type text not null,
  target_id   text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists careloop_audit_created_idx on careloop_audit_events (created_at desc);

create table if not exists careloop_summaries (
  id                text primary key,
  patient_id        text not null references careloop_patients(id) on delete cascade,
  week_start        text not null,
  week_end          text not null,
  generated_text    text not null,
  caregiver_text_en text not null,
  caregiver_text_zh text not null,
  data_completeness numeric not null,
  generated_by      text not null,
  created_at        timestamptz not null default now()
);
create index if not exists careloop_summaries_patient_idx on careloop_summaries (patient_id, created_at desc);

-- ---- WhatsApp conversation layer (per read.txt; stands alone, no FK) -------

-- phone ↔ patient mapping (inbound routing + outbound number)
create table if not exists careloop_links (
  phone       text primary key,
  patient_id  text not null,
  created_at  timestamptz not null default now()
);
create index if not exists careloop_links_patient_idx on careloop_links (patient_id);

-- one check-in session per patient/day
create table if not exists careloop_sessions (
  patient_id    text not null,
  date          text not null,
  status        text not null,            -- in_progress | complete | escalated
  collected     jsonb not null,           -- tri-state fields
  required      jsonb not null,           -- FieldKey[]
  pending_field text,
  updated_at    timestamptz not null default now(),
  primary key (patient_id, date)
);

-- conversation thread
create table if not exists careloop_messages (
  id                text primary key,
  patient_id        text not null,
  created_at        timestamptz not null default now(),
  direction         text not null,        -- inbound | outbound
  channel           text not null,        -- whatsapp
  kind              text not null,        -- text | voice | system
  body              text not null,
  language          text not null,        -- zh | en
  transcript_source text,                 -- text | stt | pinned
  extracted         jsonb,
  severity_after    text
);
create index if not exists careloop_messages_patient_idx on careloop_messages (patient_id, created_at);

-- ---- demo reset helpers (service-role rpc) -------------------------------

create or replace function careloop_truncate_core() returns void
  language sql security definer set search_path = public as $$
  truncate careloop_patients, careloop_vitals, careloop_checkins,
           careloop_alerts, careloop_audit_events, careloop_summaries cascade;
$$;

-- Clears the live conversation but KEEPS careloop_links so captured phone
-- numbers (and sticky sender→patient mapping) survive a demo reset.
create or replace function careloop_truncate_conversations() returns void
  language sql security definer set search_path = public as $$
  truncate careloop_messages, careloop_sessions;
$$;

-- ---- RLS: locked down; only the service-role key (server) has access ------

alter table careloop_patients     enable row level security;
alter table careloop_vitals       enable row level security;
alter table careloop_checkins     enable row level security;
alter table careloop_alerts       enable row level security;
alter table careloop_audit_events enable row level security;
alter table careloop_summaries    enable row level security;
alter table careloop_links        enable row level security;
alter table careloop_sessions     enable row level security;
alter table careloop_messages     enable row level security;
