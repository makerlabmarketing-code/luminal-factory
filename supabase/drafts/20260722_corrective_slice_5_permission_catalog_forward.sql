-- Corrective Slice 5 reviewed permission catalog package.
-- LIVE_APPROVAL_REQUIRED: do not execute without explicit live approval.
-- Scope: application contract parity for the approved task and reimbursement keys only.

begin;

with approved_permission_catalog(code, description) as (
  values
    ('TASK_VIEW', 'View tasks allowed by project membership, assignment, workspace, and authorization rules'),
    ('TASK_MANAGE', 'Create and update task content when project and workflow gates allow it'),
    ('TASK_ASSIGN', 'Assign, reassign, or clear task assignees when membership and employee eligibility checks pass'),
    ('TASK_REVIEW', 'Review task output and perform approved review-state actions'),
    ('REIMBURSEMENT_SUBMIT', 'Create and submit the authenticated employee reimbursement request'),
    ('REIMBURSEMENT_REVIEW', 'Inspect submitted reimbursement requests and request clarification or reject when authorized'),
    ('REIMBURSEMENT_APPROVE', 'Approve a reimbursement request; requester self-approval remains blocked by application rules'),
    ('REIMBURSEMENT_MARK_PAID', 'Confirm that an approved reimbursement has actually been paid, separate from approval')
)
insert into public.permissions (code, description)
select code, description
from approved_permission_catalog
on conflict (code) do update
set description = excluded.description;

-- Reviewed preset mapping validation is intentionally read-only in this package.
-- No employee_permissions rows are inserted, updated, or revoked here.

commit;
