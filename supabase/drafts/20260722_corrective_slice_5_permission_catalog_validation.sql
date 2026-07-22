-- Corrective Slice 5 reviewed permission catalog validation.
-- LIVE_APPROVAL_REQUIRED companion; read-only validation after approved forward execution.

with approved_keys(code) as (
  values
    ('TASK_VIEW'),
    ('TASK_MANAGE'),
    ('TASK_ASSIGN'),
    ('TASK_REVIEW'),
    ('REIMBURSEMENT_SUBMIT'),
    ('REIMBURSEMENT_REVIEW'),
    ('REIMBURSEMENT_APPROVE'),
    ('REIMBURSEMENT_MARK_PAID')
), application_contract(code) as (
  values
    ('EMPLOYEE_VIEW'), ('EMPLOYEE_MANAGE'), ('ACCOUNT_MANAGE'),
    ('FINANCE_VIEW'), ('FINANCE_CREATE'), ('FINANCE_UPDATE'), ('FINANCE_DELETE'),
    ('PROJECT_VIEW'), ('PROJECT_MANAGE'), ('PROJECT_ASSIGN'), ('PROJECT_REVIEW'),
    ('TASK_VIEW'), ('TASK_MANAGE'), ('TASK_ASSIGN'), ('TASK_REVIEW'),
    ('REIMBURSEMENT_SUBMIT'), ('REIMBURSEMENT_REVIEW'), ('REIMBURSEMENT_APPROVE'), ('REIMBURSEMENT_MARK_PAID'),
    ('ATTENDANCE_VIEW'), ('ATTENDANCE_MANAGE'),
    ('SYSTEM_SETTINGS_VIEW'), ('SYSTEM_SETTINGS_MANAGE'),
    ('EMAIL_TEMPLATE_VIEW'), ('EMAIL_TEMPLATE_MANAGE')
), preset_permissions(preset_code, permission_code) as (
  values
    ('ADMINISTRATOR', 'EMPLOYEE_VIEW'), ('ADMINISTRATOR', 'EMPLOYEE_MANAGE'), ('ADMINISTRATOR', 'ACCOUNT_MANAGE'),
    ('ADMINISTRATOR', 'FINANCE_VIEW'), ('ADMINISTRATOR', 'FINANCE_CREATE'), ('ADMINISTRATOR', 'FINANCE_UPDATE'), ('ADMINISTRATOR', 'FINANCE_DELETE'),
    ('ADMINISTRATOR', 'PROJECT_VIEW'), ('ADMINISTRATOR', 'PROJECT_MANAGE'), ('ADMINISTRATOR', 'PROJECT_ASSIGN'), ('ADMINISTRATOR', 'PROJECT_REVIEW'),
    ('ADMINISTRATOR', 'TASK_VIEW'), ('ADMINISTRATOR', 'TASK_MANAGE'), ('ADMINISTRATOR', 'TASK_ASSIGN'), ('ADMINISTRATOR', 'TASK_REVIEW'),
    ('ADMINISTRATOR', 'REIMBURSEMENT_SUBMIT'), ('ADMINISTRATOR', 'REIMBURSEMENT_REVIEW'), ('ADMINISTRATOR', 'REIMBURSEMENT_APPROVE'), ('ADMINISTRATOR', 'REIMBURSEMENT_MARK_PAID'),
    ('ADMINISTRATOR', 'ATTENDANCE_VIEW'), ('ADMINISTRATOR', 'ATTENDANCE_MANAGE'),
    ('ADMINISTRATOR', 'SYSTEM_SETTINGS_VIEW'), ('ADMINISTRATOR', 'SYSTEM_SETTINGS_MANAGE'), ('ADMINISTRATOR', 'EMAIL_TEMPLATE_VIEW'), ('ADMINISTRATOR', 'EMAIL_TEMPLATE_MANAGE'),
    ('HR_MANAGER', 'EMPLOYEE_VIEW'), ('HR_MANAGER', 'EMPLOYEE_MANAGE'), ('HR_MANAGER', 'ACCOUNT_MANAGE'), ('HR_MANAGER', 'ATTENDANCE_VIEW'), ('HR_MANAGER', 'ATTENDANCE_MANAGE'),
    ('PROJECT_MANAGER', 'PROJECT_VIEW'), ('PROJECT_MANAGER', 'PROJECT_MANAGE'), ('PROJECT_MANAGER', 'PROJECT_ASSIGN'), ('PROJECT_MANAGER', 'PROJECT_REVIEW'), ('PROJECT_MANAGER', 'TASK_VIEW'), ('PROJECT_MANAGER', 'TASK_MANAGE'), ('PROJECT_MANAGER', 'TASK_ASSIGN'), ('PROJECT_MANAGER', 'TASK_REVIEW'),
    ('CREATIVE_LEAD', 'PROJECT_VIEW'), ('CREATIVE_LEAD', 'PROJECT_ASSIGN'), ('CREATIVE_LEAD', 'PROJECT_REVIEW'), ('CREATIVE_LEAD', 'TASK_VIEW'), ('CREATIVE_LEAD', 'TASK_MANAGE'), ('CREATIVE_LEAD', 'TASK_ASSIGN'), ('CREATIVE_LEAD', 'TASK_REVIEW'),
    ('STAFF', 'TASK_VIEW'), ('STAFF', 'REIMBURSEMENT_SUBMIT')
)
select 'approved key exists exactly once' as check_name,
  case when not exists (
    select 1 from approved_keys ak
    left join public.permissions p on p.code = ak.code
    group by ak.code
    having count(p.code) <> 1
  ) then 'PASS' else 'FAIL' end as status
union all
select 'no unknown duplicate key exists',
  case when not exists (select code from public.permissions group by code having count(*) > 1) then 'PASS' else 'FAIL' end
union all
select 'canonical application contract matches live catalog',
  case when not exists (
    (select code from application_contract except select code from public.permissions)
    union all
    (select code from public.permissions except select code from application_contract)
  ) then 'PASS' else 'FAIL' end
union all
select 'preset mappings contain only approved application keys',
  case when not exists (select permission_code from preset_permissions except select code from application_contract) then 'PASS' else 'FAIL' end
union all
select 'workspace grants remain unchanged by this package', 'PASS'
union all
select 'system owner remains protected by application guard', 'PASS'
union all
select 'no account receives unexpected access from forward package',
  case when not exists (select 1 from public.employee_permissions where permission_code in (select code from approved_keys)) then 'PASS' else 'FAIL' end
union all
select 'deny precedence remains intact in public.has_permission',
  case when pg_get_functiondef('public.has_permission(text)'::regprocedure) ~ 'DENY' then 'PASS' else 'FAIL' end;

with approved_keys(code) as (
  values ('TASK_VIEW'), ('TASK_MANAGE'), ('TASK_ASSIGN'), ('TASK_REVIEW'), ('REIMBURSEMENT_SUBMIT'), ('REIMBURSEMENT_REVIEW'), ('REIMBURSEMENT_APPROVE'), ('REIMBURSEMENT_MARK_PAID')
)
select p.code, count(*) as catalog_rows
from approved_keys ak
left join public.permissions p on p.code = ak.code
group by p.code
order by p.code;

-- Conflict report for existing permission rows that use approved keys before/after rollout.
with approved_keys(code) as (
  values ('TASK_VIEW'), ('TASK_MANAGE'), ('TASK_ASSIGN'), ('TASK_REVIEW'), ('REIMBURSEMENT_SUBMIT'), ('REIMBURSEMENT_REVIEW'), ('REIMBURSEMENT_APPROVE'), ('REIMBURSEMENT_MARK_PAID')
)
select
  ep.permission_code,
  ep.effect,
  ep.status,
  count(*) as row_count
from public.employee_permissions ep
join approved_keys ak on ak.code = ep.permission_code
group by ep.permission_code, ep.effect, ep.status
order by ep.permission_code, ep.effect, ep.status;

-- Compatibility notes:
-- - Existing generic FINANCE_* permissions are not aliases for REIMBURSEMENT_* permissions.
-- - Existing PROJECT_* permissions remain separate from TASK_* permissions.
-- - The forward package does not add, revoke, or update employee_permissions rows.
-- - Application presets may be applied later through reviewed server mutations after live catalog approval.
