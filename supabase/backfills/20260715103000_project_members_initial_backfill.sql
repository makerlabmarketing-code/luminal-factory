-- Project Membership Initial Backfill.
--
-- Approved reviewed mapping for this artifact only:
-- - Project 1: employee 3 PROJECT_OWNER, employee 4 PROJECT_MANAGER,
--   employee 6 CREATIVE_LEAD.
-- - Project 2: employee 3 PROJECT_OWNER, employee 4 PROJECT_MANAGER,
--   employee 6 CREATIVE_LEAD.
--
-- This backfill intentionally does not:
-- - Modify projects, phases, tasks, staff_tasks, employees, attendance, finance,
--   auth users, or task legacy assignment fields.
-- - Create CONTRIBUTOR memberships.
-- - Infer any identity from email, full_name, assigned_to, or packer_assigned.

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
begin
  if (select count(*) from _reviewed_project_memberships) <> 6 then
    raise exception 'Precondition failed: expected exactly 6 reviewed membership rows.';
  end if;

  if exists (
    select 1
    from _reviewed_project_memberships rpm
    left join public.projects p on p.id = rpm.project_id
    where p.id is null
  ) then
    raise exception 'Precondition failed: reviewed project id is missing.';
  end if;

  if exists (
    select 1
    from _reviewed_project_memberships rpm
    left join public.employees e on e.id = rpm.employee_id
    where e.id is null
      or e.status <> 'ACTIVE'
      or coalesce(e.is_active, true) is not true
  ) then
    raise exception 'Precondition failed: reviewed employee id is missing or inactive.';
  end if;

  if exists (
    select 1
    from _reviewed_project_memberships rpm
    where rpm.role_code not in ('PROJECT_OWNER', 'PROJECT_MANAGER', 'CREATIVE_LEAD')
  ) then
    raise exception 'Precondition failed: this backfill may only create owner, manager, and creative lead memberships.';
  end if;
end $$;

with run_context as (
  select transaction_timestamp() as bootstrap_at
),
inserted as (
  insert into public.project_members (
    project_id,
    employee_id,
    role_code,
    status,
    granted_at,
    granted_by_employee_id,
    created_at,
    updated_at
  )
  select
    rpm.project_id,
    rpm.employee_id,
    rpm.role_code,
    'ACTIVE',
    rc.bootstrap_at,
    3,
    rc.bootstrap_at,
    rc.bootstrap_at
  from _reviewed_project_memberships rpm
  cross join run_context rc
  where not exists (
    select 1
    from public.project_members pm
    where pm.project_id = rpm.project_id
      and pm.employee_id = rpm.employee_id
      and pm.role_code = rpm.role_code
      and pm.status = 'ACTIVE'
  )
  returning id
)
select count(*) as inserted_project_memberships
from inserted;

do $$
begin
  if exists (
    select 1
    from public.project_members pm
    join _reviewed_project_memberships rpm
      on rpm.project_id = pm.project_id
     and rpm.employee_id = pm.employee_id
     and rpm.role_code = pm.role_code
    where pm.status = 'ACTIVE'
    group by pm.project_id, pm.employee_id, pm.role_code
    having count(*) <> 1
  ) then
    raise exception 'Postcondition failed: duplicate or missing ACTIVE membership in reviewed scope.';
  end if;
end $$;

commit;
