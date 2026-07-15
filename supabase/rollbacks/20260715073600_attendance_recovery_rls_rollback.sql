-- Rollback for Attendance Recovery & Shift Calculation Foundation RLS draft.
--
-- This rollback removes only the policies and grants introduced by the draft.
-- It intentionally does not disable RLS because prior table security state is
-- environment-specific and disabling it could widen access.

begin;

drop policy if exists "attendance staff own select" on public.attendance;
drop policy if exists "attendance staff own insert" on public.attendance;
drop policy if exists "attendance staff own update" on public.attendance;
drop policy if exists "attendance admin view select" on public.attendance;
drop policy if exists "attendance admin manage insert" on public.attendance;
drop policy if exists "attendance admin manage update" on public.attendance;
drop policy if exists "attendance admin manage delete" on public.attendance;

drop policy if exists "attendance logs staff own select" on public.attendance_logs;
drop policy if exists "attendance logs staff own insert" on public.attendance_logs;
drop policy if exists "attendance logs staff own update" on public.attendance_logs;
drop policy if exists "attendance logs admin view select" on public.attendance_logs;
drop policy if exists "attendance logs admin manage update" on public.attendance_logs;

revoke select, insert, update, delete on public.attendance from authenticated;
revoke select, insert, update, delete on public.attendance_logs from authenticated;

commit;
