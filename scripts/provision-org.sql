-- Miruwa — per-instance provisioning template.
-- Run in the NEW hospital instance's Supabase SQL editor AFTER applying
-- migrations 0001 → 0004 in order. Replace every <EDIT ME> placeholder.

-- 1. Name the organization (the 0003 migration seeds "Default Organization").
update careloop_organizations
set name = '<EDIT ME: Hospital Name>'
where is_default;

-- 2. First admin. PREREQUISITE: create the user in the dashboard first
--    (Authentication → Users → Add user, auto-confirm), then link them here.
insert into careloop_profiles (id, org_id, role, name, email)
select u.id, o.id, 'admin', '<EDIT ME: Admin Full Name>', u.email
from auth.users u, careloop_organizations o
where u.email = '<EDIT ME: admin@hospital.example>' and o.is_default
on conflict (id) do update set role = 'admin';

-- 3. Verify.
select name, is_default from careloop_organizations;
select email, role, name from careloop_profiles order by created_at;
