-- Corrective Slice 5 reviewed permission catalog rollback.
-- LIVE_APPROVAL_REQUIRED: do not execute without explicit live approval.
-- Removes only permission catalog rows introduced by this package and never deletes assignments.

begin;

do $$
begin
  if exists (
    select 1
    from public.employee_permissions
    where permission_code in (
      'TASK_VIEW', 'TASK_MANAGE', 'TASK_ASSIGN', 'TASK_REVIEW',
      'REIMBURSEMENT_SUBMIT', 'REIMBURSEMENT_REVIEW', 'REIMBURSEMENT_APPROVE', 'REIMBURSEMENT_MARK_PAID'
    )
  ) then
    raise exception 'Rollback blocked: employee permission rows reference this package keys.';
  end if;
end $$;

delete from public.permissions p
where p.code in (
    'TASK_VIEW', 'TASK_MANAGE', 'TASK_ASSIGN', 'TASK_REVIEW',
    'REIMBURSEMENT_SUBMIT', 'REIMBURSEMENT_REVIEW', 'REIMBURSEMENT_APPROVE', 'REIMBURSEMENT_MARK_PAID'
  )
  and not exists (
    select 1
    from public.employee_permissions ep
    where ep.permission_code = p.code
  );

commit;
