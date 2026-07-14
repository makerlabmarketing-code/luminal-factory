-- Validation draft only for a future approved system_settings policy-remediation slice.

-- Before running the migration draft, confirm both broad policies exist.
select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'system_settings'
  and policyname in ('Allow anon all', 'Allow authenticated all')
order by policyname;

-- After running the migration draft, both policies must be absent.
select
  count(*) as broad_policy_count_after
from pg_policies
where schemaname = 'public'
  and tablename = 'system_settings'
  and policyname in ('Allow anon all', 'Allow authenticated all');

-- Table and data must remain.
select count(*) as system_settings_rows_after
from public.system_settings;

-- Anonymous and authenticated direct reads should no longer be allowed by these
-- broad policies. If table grants still allow access, expected result is either
-- permission denied or 0 rows under RLS; do not treat app runtime as dependent
-- on this table.
begin;
  set local role anon;
  select count(*) as anon_visible_rows
  from public.system_settings;
rollback;

begin;
  set local role authenticated;
  select count(*) as authenticated_visible_rows
  from public.system_settings;
rollback;
