-- Explicit messaging consent captured at QR self-intake.
--
-- The public /intake form makes the patient opt in to WhatsApp check-ins
-- before a record is created. Store that consent (and when it was given) on the
-- patient row so it is queryable/auditable — WhatsApp + healthcare both require
-- a verifiable opt-in. Additive and idempotent, mirroring 0006_safety_loop.sql.
alter table careloop_patients
  add column if not exists consent_messaging boolean not null default false,
  add column if not exists consent_messaging_at timestamptz;
