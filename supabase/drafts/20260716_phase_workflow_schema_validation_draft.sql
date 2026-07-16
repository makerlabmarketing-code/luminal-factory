-- Validation draft for Phase Workflow Schema Slice 2.
-- Read-only. Run only after approved rollout.
--
-- Expected counts from pre-run audit on 2026-07-16:
-- projects = 6
-- phases = 4
-- tasks = 2
--
-- If live data changes before rollout, update these expected counts from the
-- pre-run row count capture before executing validation.

with expected as (
  select
    6::bigint as projects_count,
    4::bigint as phases_count,
    2::bigint as tasks_count
),
columns_check as (
  select
    column_name,
    data_type,
    is_nullable,
    column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'phases'
),
checks as (
  select
    '01 phases workflow columns exist' as check_name,
    case when count(*) filter (
      where column_name in (
        'status',
        'previous_phase_id',
        'description',
        'deadline',
        'assignee_employee_id',
        'updated_at'
      )
    ) = 6 then 'PASS' else 'FAIL' end as status,
    jsonb_agg(column_name order by column_name)::text as detail
  from columns_check

  union all
  select
    '02 phases workflow column types',
    case when
      exists (select 1 from columns_check where column_name = 'status' and data_type = 'text' and is_nullable = 'NO')
      and exists (select 1 from columns_check where column_name = 'previous_phase_id' and data_type = 'bigint' and is_nullable = 'YES')
      and exists (select 1 from columns_check where column_name = 'description' and data_type = 'text' and is_nullable = 'YES')
      and exists (select 1 from columns_check where column_name = 'deadline' and data_type = 'date' and is_nullable = 'YES')
      and exists (select 1 from columns_check where column_name = 'assignee_employee_id' and data_type = 'bigint' and is_nullable = 'YES')
      and exists (select 1 from columns_check where column_name = 'updated_at' and data_type = 'timestamp with time zone' and is_nullable = 'NO')
    then 'PASS' else 'FAIL' end,
    (select jsonb_agg(to_jsonb(c) order by column_name)::text from columns_check c where column_name in (
      'status',
      'previous_phase_id',
      'description',
      'deadline',
      'assignee_employee_id',
      'updated_at'
    ))

  union all
  select
    '03 status check constraint',
    case when exists (
      select 1
      from pg_constraint
      where conname = 'phases_status_check'
        and conrelid = 'public.phases'::regclass
        and pg_get_constraintdef(oid) ilike all (array[
          '%NOT_STARTED%',
          '%ACTIVE%',
          '%BLOCKED%',
          '%REVIEW%',
          '%COMPLETED%',
          '%CANCELLED%'
        ])
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '04 previous_phase_id self FK',
    case when exists (
      select 1
      from pg_constraint
      where conname = 'phases_previous_phase_id_fkey'
        and conrelid = 'public.phases'::regclass
        and confrelid = 'public.phases'::regclass
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '05 assignee_employee_id employee FK',
    case when exists (
      select 1
      from pg_constraint
      where conname = 'phases_assignee_employee_id_fkey'
        and conrelid = 'public.phases'::regclass
        and confrelid = 'public.employees'::regclass
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '06 no comment/progress/reviewer/task assignment columns',
    case when not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'phases'
        and column_name in (
          'comment',
          'progress',
          'reviewer_id',
          'reviewer_employee_id',
          'task_assignment_id'
        )
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '07 no cross-project previous_phase_id',
    case when not exists (
      select 1
      from public.phases p
      join public.phases previous on previous.id = p.previous_phase_id
      where previous.project_id is distinct from p.project_id
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '08 no previous_phase cycle',
    case when not exists (
      with recursive chain(root_id, id, previous_phase_id, path) as (
        select
          p.id,
          p.id,
          p.previous_phase_id,
          array[p.id]
        from public.phases p
        union all
        select
          c.root_id,
          previous.id,
          previous.previous_phase_id,
          c.path || previous.id
        from chain c
        join public.phases previous on previous.id = c.previous_phase_id
        where not previous.id = any(c.path)
      )
      select 1
      from chain c
      join public.phases previous on previous.id = c.previous_phase_id
      where previous.id = any(c.path)
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '09 first phase null previous_phase_id',
    case when not exists (
      select 1
      from (
        select
          p.*,
          row_number() over (partition by project_id order by order_index, id) as sequence_number
        from public.phases p
      ) ranked
      where sequence_number = 1
        and previous_phase_id is not null
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '10 exactly one ACTIVE phase per non-cancelled project with phases',
    case when not exists (
      select 1
      from public.projects pr
      join public.phases ph on ph.project_id = pr.id
      where coalesce(pr.status, '') <> 'CANCELLED'
      group by pr.id
      having count(*) filter (where ph.status = 'ACTIVE') <> 1
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '11 duplicate order project blocked not guessed',
    case when not exists (
      with duplicate_projects as (
        select project_id
        from public.phases
        group by project_id, order_index
        having count(*) > 1
      )
      select 1
      from public.phases p
      join duplicate_projects d on d.project_id = p.project_id
      where p.status <> 'BLOCKED'
         or p.previous_phase_id is not null
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '12 updated_at trigger exists',
    case when exists (
      select 1
      from pg_trigger
      where tgname = 'phases_set_workflow_updated_at'
        and tgrelid = 'public.phases'::regclass
        and not tgisinternal
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '13 previous phase validation trigger exists',
    case when exists (
      select 1
      from pg_trigger
      where tgname = 'phases_validate_previous_phase'
        and tgrelid = 'public.phases'::regclass
        and not tgisinternal
    ) then 'PASS' else 'FAIL' end,
    null

  union all
  select
    '14 project row count unchanged',
    case when (select count(*) from public.projects) = (select projects_count from expected)
      then 'PASS' else 'FAIL' end,
    (select count(*)::text from public.projects)

  union all
  select
    '15 phase row count unchanged',
    case when (select count(*) from public.phases) = (select phases_count from expected)
      then 'PASS' else 'FAIL' end,
    (select count(*)::text from public.phases)

  union all
  select
    '16 task row count unchanged',
    case when (select count(*) from public.tasks) = (select tasks_count from expected)
      then 'PASS' else 'FAIL' end,
    (select count(*)::text from public.tasks)

  union all
  select
    '17 rollback targets only Slice 2 objects',
    case when
      exists (select 1 from columns_check where column_name = 'status')
      and exists (select 1 from columns_check where column_name = 'previous_phase_id')
      and exists (select 1 from columns_check where column_name = 'description')
      and exists (select 1 from columns_check where column_name = 'deadline')
      and exists (select 1 from columns_check where column_name = 'assignee_employee_id')
      and exists (select 1 from columns_check where column_name = 'updated_at')
      and to_regprocedure('public.prevent_invalid_phase_previous_phase()') is not null
      and to_regprocedure('public.set_phase_workflow_updated_at()') is not null
    then 'PASS' else 'FAIL' end,
    null
)
select *
from checks
order by check_name;
