-- Validate Current Account Access Backfill Slice 2.
--
-- This script is SELECT-only. It does not mutate data.
--
-- Database-state validation:
-- - Intended for admin/migration context.
-- - Does not require auth.uid().
--
-- Session-context validation:
-- - Helper checks are reported separately.
-- - If auth.uid() is null, helper checks return SKIP instead of FAIL because
--   SQL Editor/admin context may not have a user JWT.

with
target_candidates as (
  select e.id, e.auth_user_id, e.role, e.status, coalesce(e.is_active, true) as is_active
  from public.employees e
  join auth.users u on u.id = e.auth_user_id
  where e.auth_user_id is not null
    and e.status = 'ACTIVE'
    and coalesce(e.is_active, true) = true
),
target as (
  select min(id) as employee_id
  from target_candidates
  having count(*) = 1
),
duplicate_auth_users as (
  select auth_user_id
  from public.employees
  where auth_user_id is not null
  group by auth_user_id
  having count(*) > 1
),
expected_workspaces as (
  select *
  from (values
    ('STAFF_WORKSPACE'),
    ('ADMIN_WORKSPACE')
  ) as expected(workspace)
),
target_workspace_rows as (
  select ewa.*
  from public.employee_workspace_access ewa
  join target t on t.employee_id = ewa.employee_id
),
target_active_workspace_rows as (
  select *
  from target_workspace_rows
  where status = 'ACTIVE'
    and revoked_at is null
),
target_bootstrap_workspace_rows as (
  select ewa.*
  from target_active_workspace_rows ewa
  join target t on t.employee_id = ewa.employee_id
  where ewa.granted_by_employee_id = t.employee_id
),
target_active_allow_permissions as (
  select ep.*
  from public.employee_permissions ep
  join target t on t.employee_id = ep.employee_id
  where ep.effect = 'ALLOW'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
),
target_bootstrap_allow_permissions as (
  select ep.*
  from target_active_allow_permissions ep
  join target t on t.employee_id = ep.employee_id
  where ep.granted_by_employee_id = t.employee_id
),
target_active_deny_permissions as (
  select ep.*
  from public.employee_permissions ep
  join target t on t.employee_id = ep.employee_id
  where ep.effect = 'DENY'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
),
active_workspace_duplicates as (
  select employee_id, workspace
  from public.employee_workspace_access
  where status = 'ACTIVE'
    and revoked_at is null
  group by employee_id, workspace
  having count(*) > 1
),
active_permission_duplicates as (
  select employee_id, permission_code, effect
  from public.employee_permissions
  where status = 'ACTIVE'
    and revoked_at is null
  group by employee_id, permission_code, effect
  having count(*) > 1
),
missing_workspace_rows as (
  select ew.workspace
  from expected_workspaces ew
  cross join target t
  where not exists (
    select 1
    from public.employee_workspace_access ewa
    where ewa.employee_id = t.employee_id
      and ewa.workspace = ew.workspace
      and ewa.status = 'ACTIVE'
      and ewa.revoked_at is null
  )
),
missing_permission_rows as (
  select p.code
  from public.permissions p
  cross join target t
  where not exists (
    select 1
    from public.employee_permissions ep
    where ep.employee_id = t.employee_id
      and ep.permission_code = p.code
      and ep.effect = 'ALLOW'
      and ep.status = 'ACTIVE'
      and ep.revoked_at is null
  )
),
other_employee_access_rows as (
  select ewa.employee_id
  from public.employee_workspace_access ewa
  left join target t on t.employee_id = ewa.employee_id
  where t.employee_id is null
    and ewa.status = 'ACTIVE'
    and ewa.revoked_at is null
  union all
  select ep.employee_id
  from public.employee_permissions ep
  left join target t on t.employee_id = ep.employee_id
  where t.employee_id is null
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
),
finance_policy_checks as (
  select
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'financial_ledger'
        and policyname = 'financial ledger admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    ) as financial_ledger_policy_ok,
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'office_expenses'
        and policyname = 'office expenses admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    ) as office_expenses_policy_ok,
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'shareholders'
        and policyname = 'shareholders admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    ) as shareholders_policy_ok
),
business_counts as (
  select
    (select count(*) from public.employees) as employees_count,
    (select count(*) from public.financial_ledger) as financial_ledger_count,
    (select count(*) from public.office_expenses) as office_expenses_count,
    (select count(*) from public.shareholders) as shareholders_count
),
checks as (
  select
    '01 exactly one employee target is resolved' as check_name,
    (select count(*) = 1 from target_candidates) as passed

  union all
  select
    '02 employee target is ACTIVE',
    exists (
      select 1
      from target_candidates
      where status = 'ACTIVE'
        and is_active = true
    )

  union all
  select
    '03 auth mapping is valid',
    (select count(*) = 1 from target_candidates)
    and not exists (select 1 from duplicate_auth_users)

  union all
  select
    '04 exactly 2 workspace access ACTIVE rows',
    (select count(*) = 2 from target_active_workspace_rows)

  union all
  select
    '05 STAFF_WORKSPACE exists',
    exists (
      select 1
      from target_active_workspace_rows
      where workspace = 'STAFF_WORKSPACE'
    )

  union all
  select
    '06 ADMIN_WORKSPACE exists',
    exists (
      select 1
      from target_active_workspace_rows
      where workspace = 'ADMIN_WORKSPACE'
    )

  union all
  select
    '07 no duplicate active workspace rows',
    not exists (select 1 from active_workspace_duplicates)

  union all
  select
    '08 exactly 17 permission ALLOW ACTIVE rows',
    (select count(*) = 17 from target_active_allow_permissions)

  union all
  select
    '09 all target permission codes belong to catalog',
    not exists (
      select 1
      from target_active_allow_permissions ep
      left join public.permissions p on p.code = ep.permission_code
      where p.code is null
    )
    and (select count(*) = 17 from public.permissions)

  union all
  select
    '10 no duplicate active permission rows',
    not exists (select 1 from active_permission_duplicates)

  union all
  select
    '11 no DENY ACTIVE for target',
    not exists (select 1 from target_active_deny_permissions)

  union all
  select
    '12 no other employee has bootstrap active rows',
    not exists (select 1 from other_employee_access_rows)

  union all
  select
    '13 employees.role remains compatible with old admin helper',
    exists (
      select 1
      from target_candidates
      where role in ('ADMIN', 'OWNER')
    )

  union all
  select
    '14 employees.status remains ACTIVE',
    exists (
      select 1
      from target_candidates
      where status = 'ACTIVE'
    )

  union all
  select
    '15 employees.auth_user_id remains mapped',
    exists (
      select 1
      from target_candidates
      where auth_user_id is not null
    )

  union all
  select
    '16 public.is_app_admin old shape unchanged',
    pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.auth_user_id = (select auth.uid())%'
    and pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.status = ''ACTIVE''%'
    and pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.role in (''ADMIN'', ''OWNER'')%'

  union all
  select
    '17 finance RLS unchanged',
    financial_ledger_policy_ok
    and office_expenses_policy_ok
    and shareholders_policy_ok
  from finance_policy_checks

  union all
  select
    '18 old business table row counts unchanged',
    employees_count = 5
    and financial_ledger_count = 64
    and office_expenses_count = 2
    and shareholders_count = 2
  from business_counts

  union all
  select
    '19 second backfill run would not increase row count',
    not exists (select 1 from missing_workspace_rows)
    and not exists (select 1 from missing_permission_rows)

  union all
  select
    '20 rollback targets only bootstrap rows',
    (select count(*) = 2 from target_bootstrap_workspace_rows)
    and (select count(*) = 17 from target_bootstrap_allow_permissions)
    and not exists (select 1 from other_employee_access_rows)
),
session_state as (
  select (select auth.uid()) as current_auth_uid
),
catalog_checks as (
  select
    count(*) filter (where public.has_permission(code)) as allowed_permission_count,
    count(*) as catalog_permission_count
  from public.permissions
),
session_checks as (
  select
    'S01 session auth.uid() is available' as check_name,
    current_auth_uid is not null as passed,
    current_auth_uid is null as skipped
  from session_state

  union all
  select
    'S02 has_workspace_access ADMIN_WORKSPACE',
    public.has_workspace_access('ADMIN_WORKSPACE'),
    (select current_auth_uid is null from session_state)

  union all
  select
    'S03 has_workspace_access STAFF_WORKSPACE',
    public.has_workspace_access('STAFF_WORKSPACE'),
    (select current_auth_uid is null from session_state)

  union all
  select
    'S04 has_permission true for full catalog',
    allowed_permission_count = catalog_permission_count
      and catalog_permission_count = 17,
    (select current_auth_uid is null from session_state)
  from catalog_checks
)
select
  'database-state' as validation_scope,
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks

union all

select
  'session-context' as validation_scope,
  check_name,
  case
    when skipped then 'SKIP'
    when passed then 'PASS'
    else 'FAIL'
  end as result
from session_checks
order by validation_scope, check_name;
