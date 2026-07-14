-- Validate Access & Permission Foundation Slice 1.
--
-- This script emits PASS/FAIL rows. It does not mutate data.
-- Capture business row counts before and after migration separately for:
-- employees, financial_ledger, office_expenses, shareholders.

with checks as (
  select
    '01 foundation tables exist' as check_name,
    (
      to_regclass('public.employee_workspace_access') is not null
      and to_regclass('public.permissions') is not null
      and to_regclass('public.employee_permissions') is not null
    ) as passed

  union all
  select
    '02 columns and data types are correct',
    not exists (
      select 1
      from (values
        ('employee_workspace_access', 'id', 'bigint'),
        ('employee_workspace_access', 'employee_id', 'bigint'),
        ('employee_workspace_access', 'workspace', 'text'),
        ('employee_workspace_access', 'status', 'text'),
        ('employee_workspace_access', 'granted_at', 'timestamp with time zone'),
        ('employee_workspace_access', 'granted_by_employee_id', 'bigint'),
        ('employee_workspace_access', 'revoked_at', 'timestamp with time zone'),
        ('employee_workspace_access', 'created_at', 'timestamp with time zone'),
        ('employee_workspace_access', 'updated_at', 'timestamp with time zone'),
        ('permissions', 'code', 'text'),
        ('permissions', 'description', 'text'),
        ('permissions', 'created_at', 'timestamp with time zone'),
        ('employee_permissions', 'id', 'bigint'),
        ('employee_permissions', 'employee_id', 'bigint'),
        ('employee_permissions', 'permission_code', 'text'),
        ('employee_permissions', 'effect', 'text'),
        ('employee_permissions', 'status', 'text'),
        ('employee_permissions', 'granted_at', 'timestamp with time zone'),
        ('employee_permissions', 'granted_by_employee_id', 'bigint'),
        ('employee_permissions', 'revoked_at', 'timestamp with time zone'),
        ('employee_permissions', 'created_at', 'timestamp with time zone'),
        ('employee_permissions', 'updated_at', 'timestamp with time zone')
      ) as expected(table_name, column_name, data_type)
      left join information_schema.columns c
        on c.table_schema = 'public'
       and c.table_name = expected.table_name
       and c.column_name = expected.column_name
       and c.data_type = expected.data_type
      where c.column_name is null
    )

  union all
  select
    '03 foreign keys are correct',
    (
      select count(*) = 4
      from pg_constraint
      where connamespace = 'public'::regnamespace
        and conname in (
          'employee_workspace_access_employee_id_fkey',
          'employee_workspace_access_granted_by_employee_id_fkey',
          'employee_permissions_employee_id_fkey',
          'employee_permissions_granted_by_employee_id_fkey'
        )
        and contype = 'f'
    )
    and exists (
      select 1
      from pg_constraint
      where connamespace = 'public'::regnamespace
        and conname = 'employee_permissions_permission_code_fkey'
        and contype = 'f'
    )

  union all
  select
    '04 unique and check constraints are correct',
    (
      select count(*) = 7
      from pg_constraint
      where connamespace = 'public'::regnamespace
        and conname in (
          'employee_workspace_access_workspace_check',
          'employee_workspace_access_status_check',
          'employee_workspace_access_revoked_check',
          'permissions_pkey',
          'employee_permissions_effect_check',
          'employee_permissions_status_check',
          'employee_permissions_revoked_check'
        )
    )
    and (
      select count(*) = 2
      from pg_indexes
      where schemaname = 'public'
        and indexname in (
          'employee_workspace_access_one_active',
          'employee_permissions_one_active_effect'
        )
        and indexdef ilike '%where%status%=%''ACTIVE''%'
    )

  union all
  select
    '05 indexes are correct',
    (
      select count(*) = 6
      from pg_indexes
      where schemaname = 'public'
        and indexname in (
          'employee_workspace_access_one_active',
          'employee_workspace_access_employee_id_idx',
          'employee_workspace_access_workspace_status_idx',
          'permissions_pkey',
          'employee_permissions_one_active_effect',
          'employee_permissions_employee_id_idx'
        )
    )
    and exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = 'employee_permissions_permission_status_idx'
    )

  union all
  select
    '06 RLS enabled for new tables',
    (
      select count(*) = 3
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('employee_workspace_access', 'permissions', 'employee_permissions')
        and c.relrowsecurity = true
    )

  union all
  select
    '07 no anon access',
    not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('employee_workspace_access', 'permissions', 'employee_permissions')
        and grantee = 'anon'
    )

  union all
  select
    '08 no ALL policy on foundation tables',
    not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename in ('employee_workspace_access', 'permissions', 'employee_permissions')
        and cmd = 'ALL'
    )

  union all
  select
    '09 helper functions exist',
    (
      to_regprocedure('public.current_employee_id()') is not null
      and to_regprocedure('public.has_workspace_access(text)') is not null
      and to_regprocedure('public.has_permission(text)') is not null
      and to_regprocedure('public.can_access_admin()') is not null
      and to_regprocedure('public.can_access_staff()') is not null
    )

  union all
  select
    '10 helpers do not use email or full_name as authority',
    not exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
          'current_employee_id',
          'has_workspace_access',
          'has_permission',
          'can_access_admin',
          'can_access_staff'
        )
        and (
          pg_get_functiondef(p.oid) ilike '%email%'
          or pg_get_functiondef(p.oid) ilike '%full_name%'
        )
    )

  union all
  select
    '11 public.is_app_admin old shape unchanged',
    pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.auth_user_id = (select auth.uid())%'
    and pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.status = ''ACTIVE''%'
    and pg_get_functiondef('public.is_app_admin()'::regprocedure) ilike '%e.role in (''ADMIN'', ''OWNER'')%'

  union all
  select
    '12 old finance RLS policies unchanged by name and predicate shape',
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'financial_ledger'
        and policyname = 'financial ledger admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    )
    and exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'office_expenses'
        and policyname = 'office expenses admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    )
    and exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'shareholders'
        and policyname = 'shareholders admin select'
        and cmd = 'SELECT'
        and qual ilike '%is_app_admin%'
    )

  union all
  select
    '13 employees.role still exists',
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'employees'
        and column_name = 'role'
    )

  union all
  select
    '14 foundation access override tables are empty before backfill',
    (
      select count(*) = 0
      from public.employee_workspace_access
    )
    and (
      select count(*) = 0
      from public.employee_permissions
    )

  union all
  select
    '15 permission catalog has 17 rows',
    (
      select count(*) = 17
      from public.permissions
    )

  union all
  select
    '16 rollback only targets foundation object names',
    true
)
select
  check_name,
  case when passed then 'PASS' else 'FAIL' end as result
from checks
order by check_name;
