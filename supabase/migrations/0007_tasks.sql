-- Follow-up tasks: lightweight ward to-dos attached to a patient (and
-- optionally the alert that prompted them). Powers the dashboard
-- "due today" lane and structured shift handover.
-- Org-scoped like every careloop table; RLS deny-all (service role only).

create table if not exists careloop_tasks (
  id          text primary key,
  org_id      uuid not null references careloop_organizations(id),
  patient_id  text not null,
  alert_id    text,
  description text not null,
  due_at      timestamptz not null,
  assigned_to text not null default '',
  status      text not null default 'open' check (status in ('open', 'done')),
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);

create index if not exists careloop_tasks_org_status_due_idx
  on careloop_tasks (org_id, status, due_at);
create index if not exists careloop_tasks_patient_idx
  on careloop_tasks (org_id, patient_id);

alter table careloop_tasks enable row level security;
