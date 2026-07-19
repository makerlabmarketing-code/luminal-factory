-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Pre-run read-only validation for Project Deadline Foundation.
-- This file is SELECT-only: no DDL, no DML, no live data mutation.

select
  'target_column_conflict' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projects'
  and column_name in (
    'project_deadline',
    'deadline',
    'due_date',
    'end_date',
    'target_date'
  )
order by column_name;

select
  'projects_schema' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projects'
order by ordinal_position;

select
  'projects_constraints' as section,
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.connamespace = 'public'::regnamespace
  and c.conrelid = 'public.projects'::regclass
order by c.contype, c.conname;

select
  'projects_indexes' as section,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'projects'
order by indexname;

select
  'object_name_conflict' as section,
  n.nspname as schema_name,
  c.relname as object_name,
  c.relkind as object_kind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'projects_project_deadline_idx',
    'projects_project_deadline_not_before_created_at'
  )
order by c.relname;

select
  'row_count_snapshot' as section,
  'projects' as table_name,
  count(*)::bigint as row_count
from public.projects
union all
select 'row_count_snapshot', 'phases', count(*)::bigint from public.phases
union all
select 'row_count_snapshot', 'tasks', count(*)::bigint from public.tasks
union all
select 'row_count_snapshot', 'project_members', count(*)::bigint from public.project_members
order by table_name;

select
  'projects_rls_snapshot' as section,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.projects'::regclass;

select
  'projects_policy_snapshot' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'projects'
order by policyname;

select
  'duplicate_project_name_status_report' as section,
  lower(trim(project_name)) as normalized_project_name,
  count(*)::bigint as row_count,
  string_agg(id::text || ':' || coalesce(status, 'NULL'), ', ' order by id) as projects
from public.projects
group by lower(trim(project_name))
having count(*) > 1
order by normalized_project_name;

select
  'status_values' as section,
  status,
  count(*)::bigint as row_count
from public.projects
group by status
order by status;
