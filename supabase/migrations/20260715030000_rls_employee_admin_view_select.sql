-- Employee List Read Bridge: admin workspace employee-list SELECT policy.
--
-- Scope:
-- - Allow full employees SELECT only to authenticated employees with:
--   ADMIN_WORKSPACE active access and EMPLOYEE_VIEW active ALLOW permission.
-- - Keep existing own-profile Staff policies untouched.
-- - Do not create INSERT, UPDATE, DELETE, or ALL policies.
-- - Do not modify data, Auth users, permission rows, project_members, or schema.

do $$
begin
  if to_regclass('public.employees') is null then
    raise exception 'Precondition failed: public.employees does not exist.';
  end if;

  if to_regprocedure('public.has_workspace_access(text)') is null then
    raise exception 'Precondition failed: public.has_workspace_access(text) does not exist.';
  end if;

  if to_regprocedure('public.has_permission(text)') is null then
    raise exception 'Precondition failed: public.has_permission(text) does not exist.';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'employees'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = true
  ) then
    raise exception 'Precondition failed: public.employees must have RLS enabled.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees admin employee view select'
  ) then
    raise exception 'Precondition failed: policy "employees admin employee view select" already exists.';
  end if;
end $$;

create policy "employees admin employee view select"
on public.employees
for select
to authenticated
using (
  public.has_workspace_access('ADMIN_WORKSPACE')
  and public.has_permission('EMPLOYEE_VIEW')
);
