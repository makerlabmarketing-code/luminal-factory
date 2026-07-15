-- Attendance Recovery & Shift Calculation Foundation.
--
-- Scope:
-- - Enable RLS on public.attendance and public.attendance_logs.
-- - STAFF_WORKSPACE can read and write only its own attendance rows.
-- - ADMIN_WORKSPACE + ATTENDANCE_VIEW can read attendance rows.
-- - ADMIN_WORKSPACE + ATTENDANCE_MANAGE can adjust attendance rows.
-- - Do not open attendance data to all authenticated users.
-- - Do not change attendance data, payroll data, project_members, or finance schema.

begin;

do $$
begin
  if to_regclass('public.attendance') is null then
    raise exception 'Precondition failed: public.attendance does not exist.';
  end if;

  if to_regclass('public.attendance_logs') is null then
    raise exception 'Precondition failed: public.attendance_logs does not exist.';
  end if;

  if to_regprocedure('public.current_employee_id()') is null then
    raise exception 'Precondition failed: public.current_employee_id() does not exist.';
  end if;

  if to_regprocedure('public.has_workspace_access(text)') is null then
    raise exception 'Precondition failed: public.has_workspace_access(text) does not exist.';
  end if;

  if to_regprocedure('public.has_permission(text)') is null then
    raise exception 'Precondition failed: public.has_permission(text) does not exist.';
  end if;
end $$;

grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.attendance_logs to authenticated;

alter table public.attendance enable row level security;
alter table public.attendance_logs enable row level security;

drop policy if exists "attendance staff own select" on public.attendance;
create policy "attendance staff own select"
on public.attendance
for select
to authenticated
using (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance staff own insert" on public.attendance;
create policy "attendance staff own insert"
on public.attendance
for insert
to authenticated
with check (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance staff own update" on public.attendance;
create policy "attendance staff own update"
on public.attendance
for update
to authenticated
using (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
)
with check (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance admin view select" on public.attendance;
create policy "attendance admin view select"
on public.attendance
for select
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_VIEW')
);

drop policy if exists "attendance admin manage insert" on public.attendance;
create policy "attendance admin manage insert"
on public.attendance
for insert
to authenticated
with check (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
);

drop policy if exists "attendance admin manage update" on public.attendance;
create policy "attendance admin manage update"
on public.attendance
for update
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
)
with check (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
);

drop policy if exists "attendance admin manage delete" on public.attendance;
create policy "attendance admin manage delete"
on public.attendance
for delete
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
);

drop policy if exists "attendance logs staff own select" on public.attendance_logs;
create policy "attendance logs staff own select"
on public.attendance_logs
for select
to authenticated
using (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance logs staff own insert" on public.attendance_logs;
create policy "attendance logs staff own insert"
on public.attendance_logs
for insert
to authenticated
with check (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance logs staff own update" on public.attendance_logs;
create policy "attendance logs staff own update"
on public.attendance_logs
for update
to authenticated
using (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
)
with check (
  employee_id = public.current_employee_id()
  and public.has_workspace_access('STAFF_WORKSPACE')
);

drop policy if exists "attendance logs admin view select" on public.attendance_logs;
create policy "attendance logs admin view select"
on public.attendance_logs
for select
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_VIEW')
);

drop policy if exists "attendance logs admin manage update" on public.attendance_logs;
create policy "attendance logs admin manage update"
on public.attendance_logs
for update
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
)
with check (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('ATTENDANCE_MANAGE')
);

comment on policy "attendance staff own select" on public.attendance is
  'Staff Workspace users can read only their own normalized attendance rows.';

comment on policy "attendance admin view select" on public.attendance is
  'Admin Workspace users with ATTENDANCE_VIEW can read attendance rows.';

comment on policy "attendance admin manage update" on public.attendance is
  'Admin Workspace users with ATTENDANCE_MANAGE can adjust attendance rows.';

comment on policy "attendance logs staff own select" on public.attendance_logs is
  'Staff Workspace users can read only their own legacy attendance logs.';

comment on policy "attendance logs admin view select" on public.attendance_logs is
  'Admin Workspace users with ATTENDANCE_VIEW can read legacy attendance logs.';

commit;
