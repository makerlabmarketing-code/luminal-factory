-- Validation SQL for Project Membership Foundation.
-- Run after approved rollout only. Read-only.

with expected_columns(column_name, data_type, is_nullable) as (
  values
    ('id', 'bigint', 'NO'),
    ('project_id', 'bigint', 'NO'),
    ('employee_id', 'bigint', 'NO'),
    ('role_code', 'text', 'NO'),
    ('status', 'text', 'NO'),
    ('granted_at', 'timestamp with time zone', 'NO'),
    ('granted_by_employee_id', 'bigint', 'YES'),
    ('revoked_at', 'timestamp with time zone', 'YES'),
    ('revoked_by_employee_id', 'bigint', 'YES'),
    ('created_at', 'timestamp with time zone', 'NO'),
    ('updated_at', 'timestamp with time zone', 'NO')
),
actual_columns as (
  select column_name, data_type, is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'project_members'
)
select
  '01 table and columns' as check_name,
  case
    when to_regclass('public.project_members') is not null
      and not exists (
        select 1
        from expected_columns e
        left join actual_columns a
          on a.column_name = e.column_name
         and a.data_type = e.data_type
         and a.is_nullable = e.is_nullable
        where a.column_name is null
      )
      and (select count(*) from actual_columns) = (select count(*) from expected_columns)
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  '02 foreign keys' as check_name,
  case
    when count(*) filter (
      where conname = 'project_members_project_id_fkey'
        and pg_get_constraintdef(oid) = 'FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE CASCADE ON DELETE RESTRICT'
    ) = 1
    and count(*) filter (
      where conname = 'project_members_employee_id_fkey'
        and pg_get_constraintdef(oid) = 'FOREIGN KEY (employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE RESTRICT'
    ) = 1
    and count(*) filter (
      where conname = 'project_members_granted_by_employee_id_fkey'
        and pg_get_constraintdef(oid) = 'FOREIGN KEY (granted_by_employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL'
    ) = 1
    and count(*) filter (
      where conname = 'project_members_revoked_by_employee_id_fkey'
        and pg_get_constraintdef(oid) = 'FOREIGN KEY (revoked_by_employee_id) REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL'
    ) = 1
    then 'PASS'
    else 'BLOCKED'
  end as status
from pg_constraint
where conrelid = 'public.project_members'::regclass;

select
  '03 role and status constraints' as check_name,
  case
    when count(*) filter (
      where conname = 'project_members_role_code_check'
        and pg_get_constraintdef(oid) like '%PROJECT_OWNER%'
        and pg_get_constraintdef(oid) like '%PROJECT_MANAGER%'
        and pg_get_constraintdef(oid) like '%CREATIVE_LEAD%'
        and pg_get_constraintdef(oid) like '%CONTRIBUTOR%'
        and pg_get_constraintdef(oid) not like '%REVIEWER%'
        and pg_get_constraintdef(oid) not like '%MEMBER%'
    ) = 1
    and count(*) filter (
      where conname = 'project_members_status_check'
        and pg_get_constraintdef(oid) like '%ACTIVE%'
        and pg_get_constraintdef(oid) like '%REVOKED%'
        and pg_get_constraintdef(oid) not like '%INACTIVE%'
    ) = 1
    and count(*) filter (where conname = 'project_members_revocation_state_check') = 1
    and count(*) filter (where conname = 'project_members_grant_revoke_order_check') = 1
    then 'PASS'
    else 'BLOCKED'
  end as status
from pg_constraint
where conrelid = 'public.project_members'::regclass;

select
  '04 unique active membership' as check_name,
  case
    when exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'project_members'
        and indexname = 'project_members_one_active_role'
        and indexdef ilike '%unique%'
        and indexdef ilike '%project_id%'
        and indexdef ilike '%employee_id%'
        and indexdef ilike '%role_code%'
        and indexdef ilike '%status = ''ACTIVE''%'
    )
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  '05 required indexes' as check_name,
  case
    when count(*) filter (where indexname = 'project_members_project_id_idx') = 1
     and count(*) filter (where indexname = 'project_members_employee_id_idx') = 1
     and count(*) filter (where indexname = 'project_members_status_idx') = 1
     and count(*) filter (where indexname = 'project_members_project_status_idx') = 1
    then 'PASS'
    else 'BLOCKED'
  end as status
from pg_indexes
where schemaname = 'public'
  and tablename = 'project_members';

select
  '06 rls enabled' as check_name,
  case
    when c.relrowsecurity = true
    then 'PASS'
    else 'BLOCKED'
  end as status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'project_members';

select
  '07 policy scope' as check_name,
  case
    when count(*) = 3
     and count(*) filter (where cmd = 'ALL') = 0
     and count(*) filter (where 'anon' = any(roles)) = 0
     and count(*) filter (where policyname = 'project members admin view select' and cmd = 'SELECT') = 1
     and count(*) filter (where policyname = 'project members admin manage insert' and cmd = 'INSERT') = 1
     and count(*) filter (where policyname = 'project members admin manage update' and cmd = 'UPDATE') = 1
     and bool_and(roles = array['authenticated']::name[])
     and bool_and(coalesce(qual, with_check, '') ilike '%has_workspace_access%ADMIN_WORKSPACE%')
     and bool_and(coalesce(qual, with_check, '') ilike '%has_permission%PROJECT_%')
    then 'PASS'
    else 'BLOCKED'
  end as status
from pg_policies
where schemaname = 'public'
  and tablename = 'project_members';

select
  '08 table grants no anon no delete' as check_name,
  case
    when not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'project_members'
        and grantee = 'anon'
    )
    and not exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'project_members'
        and grantee = 'authenticated'
        and privilege_type = 'DELETE'
    )
    and exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'project_members'
        and grantee = 'authenticated'
        and privilege_type = 'SELECT'
    )
    and exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'project_members'
        and grantee = 'authenticated'
        and privilege_type = 'INSERT'
    )
    and exists (
      select 1
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'project_members'
        and grantee = 'authenticated'
        and privilege_type = 'UPDATE'
    )
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  '09 helper search_path and trigger' as check_name,
  case
    when exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'set_project_members_audit_fields'
        and p.proconfig @> array['search_path=public, auth, pg_temp']
    )
    and exists (
      select 1
      from pg_trigger
      where tgrelid = 'public.project_members'::regclass
        and tgname = 'set_project_members_audit_fields'
        and not tgisinternal
    )
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  '10 rollback target objects' as check_name,
  case
    when to_regclass('public.project_members') is not null
     and to_regprocedure('public.set_project_members_audit_fields()') is not null
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  '11 project permission catalog' as check_name,
  case
    when exists (select 1 from public.permissions where code = 'PROJECT_VIEW')
     and exists (select 1 from public.permissions where code = 'PROJECT_MANAGE')
    then 'PASS'
    else 'BLOCKED'
  end as status;

select count(*) as project_members_initial_rows
from public.project_members;

select 'projects' as table_name, count(*) as row_count from public.projects
union all select 'phases', count(*) from public.phases
union all select 'tasks', count(*) from public.tasks
union all select 'staff_tasks', count(*) from public.staff_tasks
union all select 'employees', count(*) from public.employees
order by table_name;
