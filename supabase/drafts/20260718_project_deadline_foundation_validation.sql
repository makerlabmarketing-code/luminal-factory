-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Post-run read-only validation for Project Deadline Foundation.
-- Expected row-count snapshot from pre-run review on 2026-07-19:
--   projects=7, phases=5, tasks=2, project_members=6.

with expected_counts(table_name, expected_row_count) as (
  values
    ('projects', 7::bigint),
    ('phases', 5::bigint),
    ('tasks', 2::bigint),
    ('project_members', 6::bigint)
),
actual_counts as (
  select 'projects' as table_name, count(*)::bigint as row_count from public.projects
  union all select 'phases', count(*)::bigint from public.phases
  union all select 'tasks', count(*)::bigint from public.tasks
  union all select 'project_members', count(*)::bigint from public.project_members
)
select
  expected_counts.table_name,
  actual_counts.row_count,
  expected_counts.expected_row_count,
  actual_counts.row_count = expected_counts.expected_row_count as row_count_unchanged
from expected_counts
join actual_counts using (table_name)
order by expected_counts.table_name;

select
  column_name,
  data_type,
  is_nullable,
  column_default,
  data_type = 'date' as is_date,
  is_nullable = 'YES' as is_nullable_yes,
  column_default is null as default_is_null
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projects'
  and column_name = 'project_deadline';

select
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.connamespace = 'public'::regnamespace
  and c.conrelid = 'public.projects'::regclass
order by c.contype, c.conname;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'projects'
order by indexname;

select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.projects'::regclass;

select
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
  'rollback_scope_project_deadline_only' as check_name,
  true as expected_manual_review;
