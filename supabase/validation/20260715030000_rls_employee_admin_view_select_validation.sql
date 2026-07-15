-- Validation for Employee List Read Bridge SELECT policy.
-- Expected: one SELECT policy on public.employees gated by ADMIN_WORKSPACE and EMPLOYEE_VIEW.

with policy_check as (
  select
    policyname,
    cmd,
    roles,
    qual
  from pg_policies
  where schemaname = 'public'
    and tablename = 'employees'
    and policyname = 'employees admin employee view select'
)
select
  case
    when not exists (select 1 from policy_check) then
      'FAIL: employees admin employee view select policy is missing'
    when exists (
      select 1
      from policy_check
      where cmd <> 'SELECT'
        or not ('authenticated' = any(roles))
        or qual not ilike '%has_workspace_access%ADMIN_WORKSPACE%'
        or qual not ilike '%has_permission%EMPLOYEE_VIEW%'
    ) then
      'FAIL: employees admin employee view select policy predicate is incorrect'
    when exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'employees'
        and policyname = 'employees admin employee view select'
        and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
    ) then
      'FAIL: employees admin employee view policy grants non-SELECT access'
    else
      'PASS: employees admin employee view select policy is present and scoped'
  end as validation_result;
