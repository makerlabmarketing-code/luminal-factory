-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Scope: Phase Workflow Schema + Task Assignment Foundation.
-- Live audit basis:
--   public.phases has id, project_id, name, order_index, created_at.
--   public.tasks has legacy columns id, project_name, assigned_to, current_phase,
--   estimation_date, issue_note, packer_assigned, created_at.
--
-- Rollout strategy:
-- 1. Add nullable columns first. Do not enforce NOT NULL until application writes
--    and backfill rules are approved.
-- 2. Keep legacy text fields readable during compatibility window.
-- 3. Add narrow indexes for list/detail reads and assignment lookup.
-- 4. Review existing RLS before enabling writes from any new UI.

begin;

alter table public.phases
  add column if not exists description text,
  add column if not exists deadline timestamptz,
  add column if not exists assignee_employee_id bigint references public.employees(id) on delete set null,
  add column if not exists status text,
  add column if not exists dependency text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table public.phases
  add constraint phases_status_check
  check (status is null or status in (
    'BACKLOG',
    'READY',
    'IN_PROGRESS',
    'PENDING_REVIEW',
    'BLOCKED',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
  )) not valid;

create index if not exists phases_project_order_idx
  on public.phases(project_id, order_index);

create index if not exists phases_assignee_employee_id_idx
  on public.phases(assignee_employee_id)
  where assignee_employee_id is not null;

create index if not exists phases_deadline_idx
  on public.phases(deadline)
  where deadline is not null;

create index if not exists phases_status_idx
  on public.phases(status)
  where status is not null;

alter table public.tasks
  add column if not exists phase_id bigint references public.phases(id) on delete set null,
  add column if not exists parent_task_id bigint references public.tasks(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists assignee_employee_id bigint references public.employees(id) on delete set null,
  add column if not exists deadline timestamptz,
  add column if not exists status text,
  add column if not exists updated_at timestamptz;

alter table public.tasks
  add constraint tasks_status_check
  check (status is null or status in (
    'BACKLOG',
    'READY',
    'IN_PROGRESS',
    'PENDING_REVIEW',
    'BLOCKED',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
  )) not valid;

create index if not exists tasks_phase_id_idx
  on public.tasks(phase_id)
  where phase_id is not null;

create index if not exists tasks_parent_task_id_idx
  on public.tasks(parent_task_id)
  where parent_task_id is not null;

create index if not exists tasks_assignee_employee_id_idx
  on public.tasks(assignee_employee_id)
  where assignee_employee_id is not null;

create index if not exists tasks_deadline_idx
  on public.tasks(deadline)
  where deadline is not null;

create index if not exists tasks_status_idx
  on public.tasks(status)
  where status is not null;

-- Backfill draft, intentionally not executed here:
-- update public.tasks set title = project_name where title is null and project_name is not null;
-- update public.tasks set deadline = estimation_date::timestamptz where deadline is null and estimation_date is not null;
-- update public.tasks set status = current_phase where status is null and current_phase is one of the approved statuses after mapping review.
--
-- RLS impact:
-- Existing SELECT/INSERT/UPDATE policies must be audited to ensure new columns are
-- exposed only to project/workflow roles. Do not add broad anon/authenticated
-- policies to support this UI.

commit;
