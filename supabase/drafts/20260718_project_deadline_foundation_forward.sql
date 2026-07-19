-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Project Deadline Foundation.
--
-- Scope:
-- - Add a nullable date-level total deadline to public.projects.
-- - Do not backfill fake deadlines.
-- - Do not change project rows, statuses, RLS, policies, phases, tasks,
--   project_members, employees, finance, or attendance.

begin;

do $$
begin
  if to_regclass('public.projects') is null then
    raise exception 'Precondition failed: public.projects does not exist.';
  end if;
end
$$;

alter table public.projects
  add column if not exists project_deadline date null;

commit;
