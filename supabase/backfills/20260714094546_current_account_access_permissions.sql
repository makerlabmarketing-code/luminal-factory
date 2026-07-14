-- Current Account Access Backfill Slice 2.
--
-- Scope:
-- - Backfill workspace access for exactly one current ACTIVE employee mapped to Auth.
-- - Backfill ACTIVE ALLOW overrides for every existing permission catalog code.
--
-- This backfill intentionally does not:
-- - Create Auth users or send invites.
-- - Hard-code email, full_name, auth UUID, employee id, or user name.
-- - Modify employees.role, employees.status, employees.auth_user_id, project_members,
--   permission catalog rows, helper functions, routes, middleware, menus, or old RLS.
--
-- Target authority chain:
--   auth.users.id -> employees.auth_user_id -> employees.id
--
-- Bootstrap grant audit semantics:
-- - granted_by_employee_id is set to the same target employee.
-- - This is the first-account bootstrap case; using the target employee avoids
--   impersonating another employee and satisfies the existing FK semantics.
-- - granted_at, created_at, and updated_at use table defaults.

begin;

do $$
declare
  target_employee_id bigint;
  target_count integer;
  duplicate_auth_user_count integer;
  permission_count integer;
  workspace_inserted_count integer;
  permission_inserted_count integer;
  target_workspace_active_count integer;
  target_permission_allow_active_count integer;
  target_permission_deny_active_count integer;
  conflicting_workspace_grant_count integer;
  conflicting_permission_grant_count integer;
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
  into target_permission_deny_active_count
  from public.employee_permissions ep
  where ep.employee_id = target_employee_id
    and ep.effect = 'DENY'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null;

  if target_permission_deny_active_count <> 0 then
    raise exception 'Precondition failed: target has active DENY permission rows: %', target_permission_deny_active_count;
  end if;

  select count(*)
  into conflicting_workspace_grant_count
  from public.employee_workspace_access ewa
  where ewa.employee_id = target_employee_id
    and ewa.workspace in ('STAFF_WORKSPACE', 'ADMIN_WORKSPACE')
    and ewa.status = 'ACTIVE'
    and ewa.revoked_at is null
    and ewa.granted_by_employee_id is distinct from target_employee_id;

  if conflicting_workspace_grant_count <> 0 then
    raise exception 'Precondition failed: target has active workspace rows not marked as self-bootstrap grants: %', conflicting_workspace_grant_count;
  end if;

  select count(*)
  into conflicting_permission_grant_count
  from public.employee_permissions ep
  join public.permissions p on p.code = ep.permission_code
  where ep.employee_id = target_employee_id
    and ep.effect = 'ALLOW'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null
    and ep.granted_by_employee_id is distinct from target_employee_id;

  if conflicting_permission_grant_count <> 0 then
    raise exception 'Precondition failed: target has active permission rows not marked as self-bootstrap grants: %', conflicting_permission_grant_count;
  end if;

  insert into public.employee_workspace_access (
    employee_id,
    workspace,
    status,
    granted_by_employee_id
  )
  select
    target_employee_id,
    expected.workspace,
    'ACTIVE',
    target_employee_id
  from (
    values
      ('STAFF_WORKSPACE'),
      ('ADMIN_WORKSPACE')
  ) as expected(workspace)
  where not exists (
    select 1
    from public.employee_workspace_access existing
    where existing.employee_id = target_employee_id
      and existing.workspace = expected.workspace
      and existing.status = 'ACTIVE'
      and existing.revoked_at is null
  );

  get diagnostics workspace_inserted_count = row_count;

  insert into public.employee_permissions (
    employee_id,
    permission_code,
    effect,
    status,
    granted_by_employee_id
  )
  select
    target_employee_id,
    p.code,
    'ALLOW',
    'ACTIVE',
    target_employee_id
  from public.permissions p
  where not exists (
    select 1
    from public.employee_permissions existing
    where existing.employee_id = target_employee_id
      and existing.permission_code = p.code
      and existing.effect = 'ALLOW'
      and existing.status = 'ACTIVE'
      and existing.revoked_at is null
  );

  get diagnostics permission_inserted_count = row_count;

  select count(*)
  into target_workspace_active_count
  from public.employee_workspace_access ewa
  where ewa.employee_id = target_employee_id
    and ewa.workspace in ('STAFF_WORKSPACE', 'ADMIN_WORKSPACE')
    and ewa.status = 'ACTIVE'
    and ewa.revoked_at is null;

  if target_workspace_active_count <> 2 then
    raise exception 'Postcondition failed: expected 2 active target workspace rows, got %', target_workspace_active_count;
  end if;

  select count(*)
  into target_permission_allow_active_count
  from public.employee_permissions ep
  join public.permissions p on p.code = ep.permission_code
  where ep.employee_id = target_employee_id
    and ep.effect = 'ALLOW'
    and ep.status = 'ACTIVE'
    and ep.revoked_at is null;

  if target_permission_allow_active_count <> 17 then
    raise exception 'Postcondition failed: expected 17 active ALLOW target permission rows, got %', target_permission_allow_active_count;
  end if;

  if workspace_inserted_count not between 0 and 2 then
    raise exception 'Postcondition failed: workspace insert count out of range: %', workspace_inserted_count;
  end if;

  if permission_inserted_count not between 0 and 17 then
    raise exception 'Postcondition failed: permission insert count out of range: %', permission_inserted_count;
  end if;
end $$;

commit;
