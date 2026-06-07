-- At most one non-resolved alert per patient.
--
-- Closes a multi-user race: two concurrent check-ins for the same patient could
-- each read "no open alert" and then INSERT a new one, producing duplicate
-- alerts (careloop_alerts has no unique constraint on patient_id). This partial
-- unique index makes a second concurrent insert fail with 23505;
-- lib/store.ts upsertAlertFor() catches that and updates the existing open
-- alert instead of duplicating. Resolved alerts are exempt, so a patient can
-- still accumulate historical resolved alerts plus one current open one.

create unique index if not exists careloop_alerts_one_open
  on careloop_alerts (patient_id)
  where status <> 'resolved';
