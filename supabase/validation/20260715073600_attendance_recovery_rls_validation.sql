-- Validation for Attendance Recovery & Shift Calculation Foundation RLS draft.
--
-- Run after the migration is approved and applied. This query does not mutate data.

select
  'attendance row count' as check_name,
  count(*)::text as result
from public.attendance
union all
select
  'attendance_logs row count' as check_name,
  count(*)::text as result
from public.attendance_logs
union all
select
  'shifts row count' as check_name,
  count(*)::text as result
from public.shifts;

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('attendance', 'attendance_logs')
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename in ('attendance', 'attendance_logs')
  and policyname in (
    'attendance staff own select',
    'attendance staff own insert',
    'attendance staff own update',
    'attendance admin view select',
    'attendance admin manage insert',
    'attendance admin manage update',
    'attendance admin manage delete',
    'attendance logs staff own select',
    'attendance logs staff own insert',
    'attendance logs staff own update',
    'attendance logs admin view select',
    'attendance logs admin manage update'
  )
order by tablename, policyname;
