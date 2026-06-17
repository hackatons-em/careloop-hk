-- Wearable (smartwatch) integration via the Terra aggregator.
-- Two new tables + patient consent columns. Additive + idempotent.

-- Maps a Terra user to one of our patients within an org. A patient may connect
-- several providers (Garmin, Fitbit, …) → one row per Terra user_id. The Terra
-- user_id is globally unique, so (org_id, terra_user_id) is the natural key.
create table if not exists careloop_wearable_links (
  org_id        uuid not null references careloop_organizations(id),
  terra_user_id text not null,
  provider      text not null default '',
  patient_id    text not null references careloop_patients(id) on delete cascade,
  reference_id  text,
  scopes        text,
  connected_at  timestamptz not null default now(),
  last_sync_at  timestamptz,
  primary key (org_id, terra_user_id)
);
create index if not exists careloop_wearable_links_patient_idx
  on careloop_wearable_links (org_id, patient_id);

-- Raw intraday samples from wearables (high-frequency; powers the live view).
-- `type` is free-form so it can carry metrics beyond the daily VitalType set
-- (e.g. spo2, resting_heart_rate, hrv). The daily rollup is written separately
-- into careloop_vitals so the existing risk engine + trend charts are untouched.
create table if not exists careloop_wearable_samples (
  id         text primary key,
  org_id     uuid not null references careloop_organizations(id),
  patient_id text not null references careloop_patients(id) on delete cascade,
  type       text not null,
  ts         timestamptz not null,
  value      numeric not null,
  unit       text not null,
  provider   text not null default ''
);
create index if not exists careloop_wearable_samples_pt_idx
  on careloop_wearable_samples (org_id, patient_id, type, ts);

-- Explicit consent to share wearable health data (with the clinic + with Terra,
-- a third-party processor). Mirrors the consent_messaging pattern.
alter table careloop_patients
  add column if not exists consent_wearable boolean not null default false,
  add column if not exists consent_wearable_at timestamptz;

-- RLS on, no policies: service-role key only (matches every other table).
alter table careloop_wearable_links   enable row level security;
alter table careloop_wearable_samples enable row level security;
