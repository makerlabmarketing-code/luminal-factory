-- Rollback for Project Membership Initial Backfill.
--
-- Revoke only the six approved bootstrap rows if they still match the original
-- active bootstrap shape. This preserves membership history and blocks rollback
-- if later manual membership changes replaced any row.

begin;

do $$
begin
  if to_regclass('public.project_members') is null then
    raise exception 'Precondition failed: public.project_members does not exist.';
  end if;
end $$;

create temporary table _reviewed_project_memberships (
  project_id bigint not null,
  employee_id bigint not null,
  role_code text not null,
  primary key (project_id, employee_id, role_code)
) on commit drop;

insert into _reviewed_project_memberships (project_id, employee_id, role_code)
values
  (1, 3, 'PROJECT_OWNER'),
  (1, 4, 'PROJECT_MANAGER'),
  (1, 6, 'CREATIVE_LEAD'),
  (2, 3, 'PROJECT_OWNER'),
  (2, 4, 'PROJECT_MANAGER'),
  (2, 6, 'CREATIVE_LEAD');

do $$
declare
  active_count integer;
  active_batch_count integer;
begin
  select count(*)
  into active_count
  from public.project_members pm
  join _reviewed_project_memberships rpm
    on rpm.project_id = pm.project_id
   and rpm.employee_id = pm.employee_id
   and rpm.role_code = pm.role_code
  where pm.status = 'ACTIVE'
    and pm.granted_by_employee_id = 3;

  select count(distinct pm.created_at)
  into active_batch_count
  from public.project_members pm
  join _reviewed_project_memberships rpm
    on rpm.project_id = pm.project_id
   and rpm.employee_id = pm.employee_id
   and rpm.role_code = pm.role_code
  where pm.status = 'ACTIVE'
    and pm.granted_by_employee_id = 3;

  if active_count <> 6 or active_batch_count <> 1 then
    raise exception
      'Rollback blocked: expected exactly 6 active bootstrap rows from one created_at batch, found % rows across % batches.',
      active_count,
      active_batch_count;
  end if;
end $$;

update public.project_members pm
set
  status = 'REVOKED',
  revoked_at = transaction_timestamp(),
  revoked_by_employee_id = 3,
  updated_at = transaction_timestamp()
from _reviewed_project_memberships rpm
where pm.project_id = rpm.project_id
  and pm.employee_id = rpm.employee_id
  and pm.role_code = rpm.role_code
  and pm.status = 'ACTIVE'
  and pm.granted_by_employee_id = 3;

commit;
