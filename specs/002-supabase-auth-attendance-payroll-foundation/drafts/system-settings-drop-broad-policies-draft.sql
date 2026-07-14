-- Draft only: system_settings broad-policy remediation.
-- Do not run until approved as a separate database slice.
--
-- Preconditions:
-- - Runtime no longer reads or writes public.system_settings.
-- - SMTP config is provided through server environment variables.
-- - Finance/VietQR config is provided through an authenticated server route.
-- - The table remains in place; this draft drops only broad policies.

do $$
begin
  if to_regclass('public.system_settings') is null then
    raise exception 'Precondition failed: public.system_settings does not exist.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'Allow anon all'
  ) then
    raise exception 'Precondition failed: policy "Allow anon all" is not present.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'system_settings'
      and policyname = 'Allow authenticated all'
  ) then
    raise exception 'Precondition failed: policy "Allow authenticated all" is not present.';
  end if;
end $$;

drop policy "Allow anon all" on public.system_settings;
drop policy "Allow authenticated all" on public.system_settings;
