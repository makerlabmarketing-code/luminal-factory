-- Validation SQL for Project Membership Initial Backfill.
-- Run after approved foundation rollout and approved backfill only. Read-only.

with reviewed(project_id, employee_id, role_code) as (
  values
    (1::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (1::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (1::bigint, 6::bigint, 'CREATIVE_LEAD'::text),
    (2::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (2::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (2::bigint, 6::bigint, 'CREATIVE_LEAD'::text)
)
select
  '01 reviewed target projects' as check_name,
  case when count(distinct p.id) = 2 then 'PASS' else 'BLOCKED' end as status
from reviewed r
left join public.projects p on p.id = r.project_id;

with reviewed(project_id, employee_id, role_code) as (
  values
    (1::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (1::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (1::bigint, 6::bigint, 'CREATIVE_LEAD'::text),
    (2::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (2::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (2::bigint, 6::bigint, 'CREATIVE_LEAD'::text)
)
select
  '02 reviewed target employees active' as check_name,
  case
    when count(distinct e.id) = 3
     and bool_and(e.status = 'ACTIVE' and coalesce(e.is_active, true) = true)
    then 'PASS'
    else 'BLOCKED'
  end as status
from reviewed r
left join public.employees e on e.id = r.employee_id;

select
  '03 role counts' as check_name,
  case
    when count(*) filter (where role_code = 'PROJECT_OWNER') = 2
     and count(*) filter (where role_code = 'PROJECT_MANAGER') = 2
     and count(*) filter (where role_code = 'CREATIVE_LEAD') = 2
     and count(*) = 6
    then 'PASS'
    else 'BLOCKED'
  end as status
from public.project_members
where status = 'ACTIVE'
  and project_id in (1, 2)
  and employee_id in (3, 4, 6)
  and role_code in ('PROJECT_OWNER', 'PROJECT_MANAGER', 'CREATIVE_LEAD');

with reviewed(project_id, employee_id, role_code) as (
  values
    (1::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (1::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (1::bigint, 6::bigint, 'CREATIVE_LEAD'::text),
    (2::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (2::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (2::bigint, 6::bigint, 'CREATIVE_LEAD'::text)
)
select
  '04 exact reviewed memberships active' as check_name,
  case
    when count(pm.id) = 6
     and count(*) filter (where pm.id is null) = 0
    then 'PASS'
    else 'BLOCKED'
  end as status
from reviewed r
left join public.project_members pm
  on pm.project_id = r.project_id
 and pm.employee_id = r.employee_id
 and pm.role_code = r.role_code
 and pm.status = 'ACTIVE';

select
  '05 no duplicate active membership roles' as check_name,
  case when not exists (
    select 1
    from public.project_members
    where status = 'ACTIVE'
    group by project_id, employee_id, role_code
    having count(*) > 1
  ) then 'PASS' else 'BLOCKED' end as status;

select
  '06 no out of scope active membership from this backfill' as check_name,
  case when not exists (
    select 1
    from public.project_members
    where status = 'ACTIVE'
      and granted_by_employee_id = 3
      and (
        project_id not in (1, 2)
        or employee_id not in (3, 4, 6)
        or role_code not in ('PROJECT_OWNER', 'PROJECT_MANAGER', 'CREATIVE_LEAD')
      )
  ) then 'PASS' else 'BLOCKED' end as status;

with reviewed(project_id, employee_id, role_code) as (
  values
    (1::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (1::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (1::bigint, 6::bigint, 'CREATIVE_LEAD'::text),
    (2::bigint, 3::bigint, 'PROJECT_OWNER'::text),
    (2::bigint, 4::bigint, 'PROJECT_MANAGER'::text),
    (2::bigint, 6::bigint, 'CREATIVE_LEAD'::text)
)
select
  '07 second run would insert zero' as check_name,
  case
    when count(*) filter (where pm.id is null) = 0
    then 'PASS'
    else 'BLOCKED'
  end as status
from reviewed r
left join public.project_members pm
  on pm.project_id = r.project_id
 and pm.employee_id = r.employee_id
 and pm.role_code = r.role_code
 and pm.status = 'ACTIVE';

select
  '08 legacy workflow row counts unchanged from pre-run audit' as check_name,
  case
    when (select count(*) from public.projects) = 2
     and (select count(*) from public.phases) = 0
     and (select count(*) from public.tasks) = 2
     and (select count(*) from public.staff_tasks) = 0
     and (select count(*) from public.employees) = 5
    then 'PASS'
    else 'BLOCKED'
  end as status;

select
  role_code,
  count(*) as active_membership_count
from public.project_members
where status = 'ACTIVE'
  and project_id in (1, 2)
  and employee_id in (3, 4, 6)
group by role_code
order by role_code;

select
  project_id,
  employee_id,
  role_code,
  status,
  granted_by_employee_id,
  granted_at,
  revoked_at,
  revoked_by_employee_id
from public.project_members
where project_id in (1, 2)
  and employee_id in (3, 4, 6)
  and role_code in ('PROJECT_OWNER', 'PROJECT_MANAGER', 'CREATIVE_LEAD')
order by project_id, role_code, employee_id;

select 'projects' as table_name, count(*) as row_count from public.projects
union all select 'phases', count(*) from public.phases
union all select 'tasks', count(*) from public.tasks
union all select 'staff_tasks', count(*) from public.staff_tasks
union all select 'employees', count(*) from public.employees
order by table_name;
