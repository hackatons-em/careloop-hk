-- Safety loop: org notification settings + caregiver consent registry.
--
-- careloop_organizations.settings: org-level operational configuration
-- (notification inbox, SLA acknowledgement windows). JSONB so new settings
-- never need a schema change; lib/orgSettings.ts owns the typed defaults.
--
-- Patient consent: family-bound auto-sends (caregiver escalation alerts,
-- weekly digests) are OFF until explicitly consented, and a WhatsApp
-- opt-out keyword (STOP / 取消) flips them back off. consent_updated_at
-- records when consent last changed (the audit trail records who/why).

alter table careloop_organizations
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table careloop_patients
  add column if not exists caregiver_email text not null default '',
  add column if not exists consent_caregiver_alerts boolean not null default false,
  add column if not exists consent_family_digest boolean not null default false,
  add column if not exists consent_updated_at timestamptz;
