-- Rollback draft only for system-settings-drop-broad-policies-draft.sql.
-- Restores the two broad policies exactly as broad access.
-- Do not run unless rollback is explicitly approved.

create policy "Allow anon all"
on public.system_settings
as permissive
for all
to anon
using (true)
with check (true);

create policy "Allow authenticated all"
on public.system_settings
as permissive
for all
to authenticated
using (true)
with check (true);
