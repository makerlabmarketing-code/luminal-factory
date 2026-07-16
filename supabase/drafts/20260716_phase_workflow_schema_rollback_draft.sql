-- Rollback draft for Phase Workflow Schema Slice 2.
--
-- DO NOT RUN until approved.
--
-- Scope:
-- - Drop only Slice 2 triggers/functions/constraints/columns on public.phases.
-- - Do not modify projects, tasks, project_members, employees, attendance, or finance.

begin;

drop trigger if exists phases_set_workflow_updated_at on public.phases;
drop trigger if exists phases_validate_previous_phase on public.phases;

drop function if exists public.set_phase_workflow_updated_at();
drop function if exists public.prevent_invalid_phase_previous_phase();

alter table public.phases
  drop constraint if exists phases_deadline_not_before_created_at,
  drop constraint if exists phases_previous_not_self,
  drop constraint if exists phases_assignee_employee_id_fkey,
  drop constraint if exists phases_previous_phase_id_fkey,
  drop constraint if exists phases_status_check;

alter table public.phases
  drop column if exists updated_at,
  drop column if exists assignee_employee_id,
  drop column if exists deadline,
  drop column if exists description,
  drop column if exists previous_phase_id,
  drop column if exists status;

commit;
