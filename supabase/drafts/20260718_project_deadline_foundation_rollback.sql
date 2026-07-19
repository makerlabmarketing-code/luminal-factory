-- DRAFT ONLY - DO NOT RUN WITHOUT APPROVAL.
-- Rollback for 20260718_project_deadline_foundation_forward.sql.
--
-- Data-loss risk:
-- Dropping project_deadline removes historical total project deadline values.
-- This rollback intentionally refuses to run if any non-null deadline exists.

begin;

do $$
declare
  deadline_count bigint := 0;
begin
  if to_regclass('public.projects') is null then
    raise exception 'Precondition failed: public.projects does not exist.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'projects'
      and column_name = 'project_deadline'
  ) then
    execute 'select count(*) from public.projects where project_deadline is not null'
      into deadline_count;
  end if;

  if deadline_count > 0 then
    raise exception 'Rollback blocked: public.projects.project_deadline has % non-null rows.', deadline_count;
  end if;
end
$$;

alter table public.projects
  drop column if exists project_deadline;

commit;
