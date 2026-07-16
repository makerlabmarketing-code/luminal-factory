-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Read-only validation queries for a reviewed migration window.

-- Confirm new phase columns exist.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'phases'
  and column_name in (
    'description',
    'deadline',
    'assignee_employee_id',
    'status',
    'dependency',
    'started_at',
    'completed_at',
    'updated_at'
  )
order by column_name;

-- Confirm new task columns exist.
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tasks'
  and column_name in (
    'phase_id',
    'parent_task_id',
    'title',
    'description',
    'assignee_employee_id',
    'deadline',
    'status',
    'updated_at'
  )
order by column_name;

-- Check FK orphan risk after any approved backfill.
select count(*) as tasks_with_missing_phase
from public.tasks task
left join public.phases phase on phase.id = task.phase_id
where task.phase_id is not null
  and phase.id is null;

select count(*) as tasks_with_missing_assignee
from public.tasks task
left join public.employees employee on employee.id = task.assignee_employee_id
where task.assignee_employee_id is not null
  and employee.id is null;

select count(*) as phases_with_missing_assignee
from public.phases phase
left join public.employees employee on employee.id = phase.assignee_employee_id
where phase.assignee_employee_id is not null
  and employee.id is null;

-- Check status values before validating constraints.
select status, count(*)
from public.phases
where status is not null
group by status
order by status;

select status, count(*)
from public.tasks
where status is not null
group by status
order by status;
