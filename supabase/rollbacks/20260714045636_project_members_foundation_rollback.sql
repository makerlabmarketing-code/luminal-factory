-- Rollback for Project Membership Foundation.
--
-- Drops only objects introduced by
-- 20260714045636_project_members_foundation.sql.
--
-- Data-loss warning:
-- dropping public.project_members removes membership history. Use only before
-- live backfill or after explicitly exporting/preserving membership records.

begin;

do $$
begin
  if to_regclass('public.project_members') is not null then
    execute 'drop policy if exists "project members admin view select" on public.project_members';
    execute 'drop policy if exists "project members admin manage insert" on public.project_members';
    execute 'drop policy if exists "project members admin manage update" on public.project_members';

    revoke select, insert, update on public.project_members from authenticated;
  end if;

  if to_regclass('public.project_members_id_seq') is not null then
    revoke usage on sequence public.project_members_id_seq from authenticated;
  end if;
end $$;

drop table if exists public.project_members;
drop function if exists public.set_project_members_audit_fields();

commit;
