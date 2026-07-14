-- Roll back Current Account Access Backfill Slice 2.
--
-- Scope:
-- - Delete only the bootstrap access rows for exactly one current ACTIVE
--   Auth-mapped employee target:
--   - STAFF_WORKSPACE ACTIVE
--   - ADMIN_WORKSPACE ACTIVE
--   - all 17 catalog permission ACTIVE ALLOW rows
--
-- This rollback intentionally does not:
-- - Delete permission catalog rows.
-- - Drop foundation tables or helper functions.
-- - Modify employees, auth.users, project_members, business data, routes, menus,
--   middleware, or old RLS.

begin;

do $$
declare
  target_employee_id bigint;
  target_count integer;
  duplicate_auth_user_count integer;
  permission_count integer;
  target_workspace_delete_count integer;
  target_permission_delete_count integer;
  workspace_deleted_count integer;
  permission_deleted_count integer;
begin
  if to_regclass('public.employees') is null then
    raise exception 'Precondition failed: public.employees does not exist.';
  end if;

  if to_regclass('public.employee_workspace_access') is null then
    raise exception 'Precondition failed: public.employee_workspace_access does not exist.';
  end if;

  if to_regclass('public.permissions') is null then
    raise exception 'Precondition failed: public.permissions does not exist.';
  end if;

  if to_regclass('public.employee_permissions') is null then
    raise exception 'Precondition failed: public.employee_permissions does not exist.';
  end if;

  select count(*)
  into duplicate_auth_user_count
  from (
    select auth_user_id
    from public.employees
    where auth_user_id is not null
    group by auth_user_id
    having count(*) > 1
  ) duplicates;

  if duplicate_auth_user_count <> 0 then
    raise exception 'Precondition failed: duplicate employees.auth_user_id groups found: %', duplicate_auth_user_count;
  end if;

  select count(*), min(e.id)
  into target_count, target_employee_id
  from public.employees e
  join auth.users u on u.id = e.auth_user_id
  where e.auth_user_id is not null
    and e.status = 'ACTIVE'
    and coalesce(e.is_active, true) = true;

  if target_count <> 1 or target_employee_id is null then
    raise exception 'Precondition failed: expected exactly one ACTIVE Auth-mapped employee target, got %', target_count;
  end if;

  select count(*)
  into permission_count
  from public.permissions;

  if permission_count <> 17 then
    raise exception 'Precondition failed: expected exactly 17 permission catalog rows, got %', permission_count;
  end if;

  select count(*)
  into target_workspace_delete_count
  from public.employee_workspace_access ewa
  where ewa.employee_id = target_employee_id
    and ewa.workspace in ('STAFF_WORKSPACE', 'ADMIN_WORKSPACE')
    and ewa.status = 'ACTIVE'
    and ewa.revoked_at is null
    and ewa.granted_by_employee_id = target_employee_id;

  if target_workspace_delete_count <> 2 then
    raise exception 'Precondition failed: expected exactly 2 active target workspace rows to rollback, got %', target_workspace_delete_count;
  end if;

  select count(*)
  into target_permission_delete_count
  from public.employee_permissions ep
  join public.permissions p on p.code = ep.permission_code
  where ep.employee_id = target_employee_id
    and ep.effect = 'ALLOW'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
    and ep.granted_by_employee_id = target_employee_id;

  if target_permission_delete_count <> 17 then
    raise exception 'Precondition failed: expected exactly 17 active ALLOW target permission rows to rollback, got %', target_permission_delete_count;
  end if;

  delete from public.employee_workspace_access ewa
  where ewa.employee_id = target_employee_id
    and ewa.workspace in ('STAFF_WORKSPACE', 'ADMIN_WORKSPACE')
    and ewa.status = 'ACTIVE'
    and ewa.revoked_at is null
    and ewa.granted_by_employee_id = target_employee_id;

  get diagnostics workspace_deleted_count = row_count;

  if workspace_deleted_count <> 2 then
    raise exception 'Rollback failed: deleted % workspace rows, expected 2', workspace_deleted_count;
  end if;

  delete from public.employee_permissions ep
  using public.permissions p
  where ep.permission_code = p.code
    and ep.employee_id = target_employee_id
    and ep.effect = 'ALLOW'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
    and ep.granted_by_employee_id = target_employee_id;

  get diagnostics permission_deleted_count = row_count;

  if permission_deleted_count <> 17 then
    raise exception 'Rollback failed: deleted % permission rows, expected 17', permission_deleted_count;
  end if;
end $$;

commit;
