-- Arabic (MSA) localization support.
--
-- 1) Per-patient preferred message language for the OUTBOUND WhatsApp check-in
--    and family/caregiver delivery. 'auto' (the default) keeps the historical
--    bilingual Cantonese + English outbound prompt; inbound replies are always
--    auto-detected (lib/ingest.ts) regardless of this value.
--    Allowed values: 'auto' | 'en' | 'zh-HK' | 'ar'.
--
-- 2) An Arabic caregiver-summary column so the stored weekly summary can be
--    delivered to Arabic-preference families (lib/digest.ts). Backfilled to ''
--    for existing rows; regenerated on the next summary.

alter table careloop_patients
  add column if not exists preferred_language text not null default 'auto';

alter table careloop_summaries
  add column if not exists caregiver_text_ar text not null default '';
