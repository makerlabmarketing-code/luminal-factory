-- Roll back Access & Permission Foundation Slice 1.
--
-- Scope:
-- - Drops only foundation objects created by
--   20260714082140_access_permission_foundation.sql.
-- - Does not touch public.is_app_admin(), existing finance RLS policies,
--   employees.role, project_members, routes, middleware, Auth users, or invites.

begin;

drop policy if exists "employee permissions own select" on public.employee_permissions;
drop policy if exists "employee workspace access own select" on public.employee_workspace_access;
drop policy if exists "permissions authenticated select" on public.permissions;

revoke all on function public.can_access_staff() from public;
revoke all on function public.can_access_staff() from anon;
revoke all on function public.can_access_staff() from authenticated;
revoke all on function public.can_access_admin() from public;
revoke all on function public.can_access_admin() from anon;
revoke all on function public.can_access_admin() from authenticated;
revoke all on function public.has_permission(text) from public;
revoke all on function public.has_permission(text) from anon;
revoke all on function public.has_permission(text) from authenticated;
revoke all on function public.has_workspace_access(text) from public;
revoke all on function public.has_workspace_access(text) from anon;
revoke all on function public.has_workspace_access(text) from authenticated;
revoke all on function public.current_employee_id() from public;
revoke all on function public.current_employee_id() from anon;
revoke all on function public.current_employee_id() from authenticated;

drop function if exists public.can_access_staff();
drop function if exists public.can_access_admin();
drop function if exists public.has_permission(text);
drop function if exists public.has_workspace_access(text);
drop function if exists public.current_employee_id();

drop trigger if exists set_employee_permissions_updated_at on public.employee_permissions;
drop trigger if exists set_employee_workspace_access_updated_at on public.employee_workspace_access;
drop function if exists public.set_access_permissions_updated_at();

drop table if exists public.employee_permissions;
drop table if exists public.employee_workspace_access;
drop table if exists public.permissions;

commit;
