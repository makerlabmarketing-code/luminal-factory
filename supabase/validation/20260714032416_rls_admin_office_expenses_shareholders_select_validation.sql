-- Validation SQL for RLS slice 2.
-- Replace placeholder UUIDs only in the SQL runner/session.
-- Do not commit real Auth UUIDs.

-- PRE-RUN STRUCTURE AND COUNT CHECKS

select
  c.relname,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('office_expenses', 'shareholders')
order by c.relname;

select count(*) as office_expenses_rows_before
from public.office_expenses;

select count(*) as shareholders_rows_before
from public.shareholders;

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('office_expenses', 'shareholders')
order by tablename, policyname;

select
  pg_get_functiondef(p.oid) as function_definition,
  pg_get_userbyid(p.proowner) as owner_name,
  p.prosecdef as security_definer,
  p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'is_app_admin';

-- POST-ROLLOUT STRUCTURE CHECKS

select
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('office_expenses', 'shareholders')
  and policyname in ('office expenses admin select', 'shareholders admin select')
order by tablename, policyname;

select
  count(*) as non_select_policy_count
from pg_policies
where schemaname = 'public'
  and tablename in ('office_expenses', 'shareholders')
  and policyname in ('office expenses admin select', 'shareholders admin select')
  and cmd <> 'SELECT';

-- SECURITY TEST CASES
-- Run each case in its own transaction.

-- Case 1: anonymous cannot read either table.
begin;
  set local role anon;
  select count(*) as anon_office_expenses_visible_rows
  from public.office_expenses;
  select count(*) as anon_shareholders_visible_rows
  from public.shareholders;
rollback;

-- Case 2: mapped ADMIN/OWNER ACTIVE can read both tables.
begin;
  set local role authenticated;
  set local "request.jwt.claim.sub" = '<ADMIN_ACTIVE_AUTH_UUID>';
  select public.is_app_admin() as admin_is_admin;
  select count(*) as admin_office_expenses_visible_rows
  from public.office_expenses;
  select count(*) as admin_shareholders_visible_rows
  from public.shareholders;
rollback;

-- Case 3: authenticated user not mapped to employees cannot read either table.
begin;
  set local role authenticated;
  set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000000';
  select public.is_app_admin() as unmapped_is_admin;
  select count(*) as unmapped_office_expenses_visible_rows
  from public.office_expenses;
  select count(*) as unmapped_shareholders_visible_rows
  from public.shareholders;
rollback;

-- Case 4: STAFF ACTIVE cannot read either table when a mapped fixture exists.
begin;
  set local role authenticated;
  set local "request.jwt.claim.sub" = '<STAFF_ACTIVE_AUTH_UUID>';
  select public.is_app_admin() as staff_is_admin;
  select count(*) as staff_office_expenses_visible_rows
  from public.office_expenses;
  select count(*) as staff_shareholders_visible_rows
  from public.shareholders;
rollback;

-- Case 5: ADMIN/OWNER INACTIVE cannot read either table when a mapped fixture exists.
begin;
  set local role authenticated;
  set local "request.jwt.claim.sub" = '<ADMIN_INACTIVE_AUTH_UUID>';
  select public.is_app_admin() as inactive_admin_is_admin;
  select count(*) as inactive_admin_office_expenses_visible_rows
  from public.office_expenses;
  select count(*) as inactive_admin_shareholders_visible_rows
  from public.shareholders;
rollback;

-- Case 6: data counts are unchanged by policy migration.
select count(*) as office_expenses_rows_after
from public.office_expenses;

select count(*) as shareholders_rows_after
from public.shareholders;

-- Case 7: no policy outside the two target policies changed.
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and policyname in ('office expenses admin select', 'shareholders admin select')
order by tablename, policyname;
