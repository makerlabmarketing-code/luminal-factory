-- Validation SQL for Project Membership Foundation.
-- Run after approved rollout only.

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'project_members'
order by ordinal_position;

select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  pg_get_constraintdef(pc.oid) as constraint_definition
from information_schema.table_constraints tc
join pg_constraint pc
  on pc.conname = tc.constraint_name
join pg_namespace pn
  on pn.oid = pc.connamespace
 and pn.nspname = tc.constraint_schema
left join information_schema.key_column_usage kcu
  on kcu.constraint_schema = tc.constraint_schema
 and kcu.constraint_name = tc.constraint_name
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_schema = tc.constraint_schema
 and ccu.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name = 'project_members'
order by tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'project_members'
order by indexname;

select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'project_members';

select
  count(*) as project_members_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'project_members';

select count(*) as project_members_initial_rows
from public.project_members;

select
  'projects' as table_name,
  count(*) as row_count
from public.projects
union all
select 'phases', count(*) from public.phases
union all
select 'tasks', count(*) from public.tasks
union all
select 'staff_tasks', count(*) from public.staff_tasks
order by table_name;

select
  tgname as trigger_name,
  tgenabled as trigger_enabled
from pg_trigger
where tgrelid = 'public.project_members'::regclass
  and not tgisinternal
order by tgname;
