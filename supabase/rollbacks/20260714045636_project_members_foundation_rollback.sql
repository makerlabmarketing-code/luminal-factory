-- Rollback for Project Membership Foundation.
--
-- Drops only objects introduced by
-- 20260714045636_project_members_foundation.sql.
--
-- Data-loss warning:
-- dropping public.project_members removes membership history. Use only before
-- live backfill or after explicitly exporting/preserving membership records.

drop table if exists public.project_members;
drop function if exists public.set_project_members_updated_at();
