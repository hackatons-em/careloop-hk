-- Independent debounce stamp for caregiver (family) delivery.
--
-- Nurse paging and consent-gated family delivery previously shared one
-- last_notified_at, so a sub-threshold nurse page (review_today) could
-- debounce the FIRST family escalation (review_today→escalate), losing it
-- entirely. Tracking family delivery separately guarantees the first escalate
-- always reaches the family, while still rate-limiting re-sends on flapping.

alter table careloop_alerts
  add column if not exists last_caregiver_notified_at timestamptz;