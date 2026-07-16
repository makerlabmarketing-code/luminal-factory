-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Rollback for 20260716_phase_task_edit_capability_forward_draft.sql.

begin;

drop index if exists public.tasks_status_idx;
drop index if exists public.tasks_deadline_idx;
drop index if exists public.tasks_assignee_employee_id_idx;
drop index if exists public.tasks_parent_task_id_idx;
drop index if exists public.tasks_phase_id_idx;

alter table public.tasks
  drop constraint if exists tasks_status_check,
  drop column if exists updated_at,
  drop column if exists status,
  drop column if exists deadline,
  drop column if exists assignee_employee_id,
  drop column if exists description,
  drop column if exists title,
  drop column if exists parent_task_id,
  drop column if exists phase_id;

drop index if exists public.phases_status_idx;
drop index if exists public.phases_deadline_idx;
drop index if exists public.phases_assignee_employee_id_idx;
drop index if exists public.phases_project_order_idx;

alter table public.phases
  drop constraint if exists phases_status_check,
  drop column if exists updated_at,
  drop column if exists completed_at,
  drop column if exists started_at,
  drop column if exists dependency,
  drop column if exists status,
  drop column if exists assignee_employee_id,
  drop column if exists deadline,
  drop column if exists description;

commit;
