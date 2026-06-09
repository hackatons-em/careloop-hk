-- CareLoop — sales leads (demo-request / contact form submissions).
--
-- Platform-level table: leads arrive BEFORE an organization exists, so there
-- is deliberately no org_id. Service-role only, matching the deny-all RLS
-- idiom of 0001/0003. Apply via the SQL editor or `supabase db push`.

create table if not exists careloop_leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  organization text not null,
  role         text not null default '',
  email        text not null,
  phone        text not null default '',
  message      text not null default '',
  interest     text not null check (interest in ('pilot', 'demo', 'pricing', 'other')),
  locale       text not null default 'en',
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at   timestamptz not null default now()
);

create index if not exists careloop_leads_status_idx on careloop_leads (status, created_at desc);

-- Deny-all: no policies; only the server's service-role key can touch leads.
alter table careloop_leads enable row level security;
