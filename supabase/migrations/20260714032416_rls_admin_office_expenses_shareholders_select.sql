-- RLS slice 2: Admin/Owner read access for office expenses and shareholders.
--
-- Scope:
-- - Add SELECT policy for public.office_expenses.
-- - Add SELECT policy for public.shareholders.
-- - Reuse public.is_app_admin().
-- - Do not create INSERT, UPDATE, DELETE, or ALL policies.
-- - Do not alter data, roles, grants, table schemas, or RLS state.

do $$
begin
  if to_regclass('public.office_expenses') is null then
    raise exception 'Precondition failed: public.office_expenses does not exist.';
  end if;

  if to_regclass('public.shareholders') is null then
    raise exception 'Precondition failed: public.shareholders does not exist.';
  end if;

  if to_regprocedure('public.is_app_admin()') is null then
    raise exception 'Precondition failed: public.is_app_admin() does not exist.';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'office_expenses'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = true
  ) then
    raise exception 'Precondition failed: public.office_expenses must have RLS enabled.';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'shareholders'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity = true
  ) then
    raise exception 'Precondition failed: public.shareholders must have RLS enabled.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'office_expenses'
      and policyname = 'office expenses admin select'
  ) then
    raise exception 'Precondition failed: policy "office expenses admin select" already exists.';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shareholders'
      and policyname = 'shareholders admin select'
  ) then
    raise exception 'Precondition failed: policy "shareholders admin select" already exists.';
  end if;
end $$;

create policy "office expenses admin select"
on public.office_expenses
for select
to authenticated
using (public.is_app_admin());

create policy "shareholders admin select"
on public.shareholders
for select
to authenticated
using (public.is_app_admin());
