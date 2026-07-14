-- Rollback for RLS slice 2.
-- Drops only the SELECT policies introduced by
-- 20260714032416_rls_admin_office_expenses_shareholders_select.sql.

drop policy if exists "office expenses admin select" on public.office_expenses;
drop policy if exists "shareholders admin select" on public.shareholders;
