-- Phase Workflow Schema Slice 2 migration draft.
--
-- DO NOT RUN until approved.
--
-- Scope:
-- - Add minimal sequential workflow columns to public.phases.
-- - Backfill status and previous_phase_id only.
-- - Add integrity guards for status, same-project previous phase, no cycles,
--   deadline not before created_at, and updated_at maintenance.
--
-- Explicit non-scope:
-- - No comments table.
-- - No progress column.
-- - No reviewer column.
-- - No task assignment.
-- - No activity log.
-- - No RLS policy changes.
-- - No project/task/member data changes.

begin;

do $$
begin
  if to_regclass('public.phases') is null then
    raise exception 'Precondition failed: public.phases does not exist.';
  end if;

  if to_regclass('public.projects') is null then
    raise exception 'Precondition failed: public.projects does not exist.';
  end if;

  if to_regclass('public.employees') is null then
    raise exception 'Precondition failed: public.employees does not exist.';
  end if;
end $$;

alter table public.phases
  add column if not exists status text,
  add column if not exists previous_phase_id bigint,
  add column if not exists description text,
  add column if not exists deadline date,
  add column if not exists assignee_employee_id bigint,
  add column if not exists updated_at timestamptz;

alter table public.phases
  alter column status set default 'NOT_STARTED',
  alter column updated_at set default now();

update public.phases
set
  status = coalesce(status, 'NOT_STARTED'),
  updated_at = coalesce(updated_at, now())
where status is null
   or updated_at is null;

alter table public.phases
  alter column status set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'phases_status_check'
      and conrelid = 'public.phases'::regclass
  ) then
    alter table public.phases
      add constraint phases_status_check
      check (status in (
        'NOT_STARTED',
        'ACTIVE',
        'BLOCKED',
        'REVIEW',
        'COMPLETED',
        'CANCELLED'
      ));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'phases_previous_phase_id_fkey'
      and conrelid = 'public.phases'::regclass
  ) then
    alter table public.phases
      add constraint phases_previous_phase_id_fkey
      foreign key (previous_phase_id)
      references public.phases(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'phases_assignee_employee_id_fkey'
      and conrelid = 'public.phases'::regclass
  ) then
    alter table public.phases
      add constraint phases_assignee_employee_id_fkey
      foreign key (assignee_employee_id)
      references public.employees(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'phases_deadline_not_before_created_at'
      and conrelid = 'public.phases'::regclass
  ) then
    alter table public.phases
      add constraint phases_deadline_not_before_created_at
      check (deadline is null or created_at is null or deadline >= created_at::date);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'phases_previous_not_self'
      and conrelid = 'public.phases'::regclass
  ) then
    alter table public.phases
      add constraint phases_previous_not_self
      check (previous_phase_id is null or previous_phase_id <> id);
  end if;
end $$;

create or replace function public.prevent_invalid_phase_previous_phase()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  previous_project_id bigint;
  has_cycle boolean;
begin
  if new.previous_phase_id is null then
    return new;
  end if;

  select p.project_id
  into previous_project_id
  from public.phases p
  where p.id = new.previous_phase_id;

  if previous_project_id is null then
    raise exception 'Invalid previous_phase_id: referenced phase does not exist.';
  end if;

  if previous_project_id is distinct from new.project_id then
    raise exception 'Invalid previous_phase_id: phase belongs to another project.';
  end if;

  with recursive chain(id, previous_phase_id) as (
    select p.id, p.previous_phase_id
    from public.phases p
    where p.id = new.previous_phase_id
    union all
    select parent.id, parent.previous_phase_id
    from public.phases parent
    join chain c on c.previous_phase_id = parent.id
  )
  select exists (
    select 1
    from chain
    where id = new.id
  )
  into has_cycle;

  if has_cycle then
    raise exception 'Invalid previous_phase_id: cycle detected.';
  end if;

  return new;
end;
$$;

create or replace function public.set_phase_workflow_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists phases_validate_previous_phase on public.phases;
create trigger phases_validate_previous_phase
before insert or update of project_id, previous_phase_id
on public.phases
for each row
execute function public.prevent_invalid_phase_previous_phase();

drop trigger if exists phases_set_workflow_updated_at on public.phases;
create trigger phases_set_workflow_updated_at
before update
on public.phases
for each row
execute function public.set_phase_workflow_updated_at();

with ordered as (
  select
    p.id,
    p.project_id,
    p.order_index,
    count(*) over (partition by p.project_id, p.order_index) as same_order_count,
    row_number() over (partition by p.project_id order by p.order_index, p.id) as sequence_number,
    lag(p.id) over (partition by p.project_id order by p.order_index, p.id) as previous_id
  from public.phases p
),
ambiguous_projects as (
  select distinct project_id
  from ordered
  where same_order_count > 1
),
backfill as (
  select
    o.id,
    case
      when a.project_id is not null then 'BLOCKED'
      when o.sequence_number = 1 then 'ACTIVE'
      else 'NOT_STARTED'
    end as next_status,
    case
      when a.project_id is not null then null
      else o.previous_id
    end as next_previous_phase_id
  from ordered o
  left join ambiguous_projects a on a.project_id = o.project_id
)
update public.phases p
set
  status = b.next_status,
  previous_phase_id = b.next_previous_phase_id
from backfill b
where p.id = b.id
  and (
    p.status is distinct from b.next_status
    or p.previous_phase_id is distinct from b.next_previous_phase_id
  );

comment on column public.phases.status is
  'Sequential phase workflow status. Mutations must go through server boundary.';
comment on column public.phases.previous_phase_id is
  'Nullable self-reference to the previous phase in the same project. First phase is null.';
comment on column public.phases.description is
  'Optional phase description. Not a comment history field.';
comment on column public.phases.deadline is
  'Optional phase due date. Date is used because current workflow has date-level deadlines.';
comment on column public.phases.assignee_employee_id is
  'Optional assignee employee id. Application must only assign ACTIVE employees.';
comment on column public.phases.updated_at is
  'Maintained by phases_set_workflow_updated_at trigger.';

commit;
