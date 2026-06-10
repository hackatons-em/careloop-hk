-- Allow follow-up tasks to be cancelled (e.g. created on the wrong patient or
-- a typo), distinct from a genuine completion — so the audit trail stays
-- honest. Widens the status CHECK from ('open','done') to add 'cancelled'.

alter table careloop_tasks drop constraint if exists careloop_tasks_status_check;
alter table careloop_tasks add constraint careloop_tasks_status_check
  check (status in ('open', 'done', 'cancelled'));
