# Batch 3 Identity Mapping, Schema Migration Plan, and RLS Authorization Plan

Date: 2026-07-12

Scope: Batch 3 step 1 only. This document audits repository evidence, designs the identity migration, designs RLS/server authorization, and defines backfill, rollback, validation, and security-test plans. It does not run SQL, create a migration file, change production schema, enable RLS, modify payroll calculation, or change UI.

## 1. Batch 3 Task Mapping

| Plan task ID | Batch 3 step 1 coverage |
|---|---|
| Phase A: Discovery Lock | Schema/RLS inventory from repository evidence, current identity flow, current relationship keys, storage evidence, and live-audit gaps. |
| Phase B: Contract Design | Target identity path, role/action/scope authorization model, target table and storage policy model. |
| Phase D: Migration And Backfill Design | Schema diff, pseudo-migration SQL, backfill dry-run queries, duplicate handling, compatibility, rollback, post-migration checks. |
| Safe Foundation Task 8 | Stable employee-ID relationship compatibility plan for finance, workflow, attendance, payroll, and audit references. |
| Safe Foundation Task 9 | RLS/server authorization plan for employees, attendance, payroll/rates, finance, projects/tasks, audit, and storage. |

## 2. Sources Reviewed

Repository sources:

- `AGENTS.md`
- `SETUP-CODEX-ERP.md`
- `specs/002-supabase-auth-attendance-payroll-foundation/spec.md`
- `specs/002-supabase-auth-attendance-payroll-foundation/plan.md`
- `specs/002-supabase-auth-attendance-payroll-foundation/batch-1-audit.md`
- `.agents/skills/luminal-erp/references/{architecture,erp-domain,project-context,supabase-contract,workflow}.md`
- `supabase/migrations/*`
- `app/api/**`
- `app/admin/**`
- `app/staff/**`
- `services/**`
- `lib/types/**`
- `lib/supabase.ts`
- `ultis/supabase/**`

Official Supabase references checked:

- Changelog: https://supabase.com/changelog
- Database overview and RLS: https://supabase.com/docs/guides/database/overview and https://supabase.com/docs/guides/database/postgres/row-level-security
- Auth overview and user data: https://supabase.com/docs/guides/auth and https://supabase.com/docs/guides/auth/managing-user-data
- Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals and https://supabase.com/docs/guides/storage/buckets/creating-buckets

Supabase documentation constraints applied:

- RLS must be enabled for tables in exposed schemas such as `public`.
- `auth.uid()` returns `null` for unauthenticated requests, so policies should explicitly require authenticated identity.
- `UPDATE` policies need both a visible row via `USING` and allowed new row via `WITH CHECK`.
- Private storage buckets enforce access through `storage.objects` RLS or short-lived signed URLs; public buckets allow anyone with the URL to read files.
- Public tables that reference Supabase Auth should reference the stable primary key `auth.users.id`.

## 3. Audit Limitations

No `.env*`, `.mcp.json`, Supabase config, or Supabase CLI was available in this workspace. The `supabase` CLI command is not installed. Therefore:

- live `auth.users` could not be queried;
- live `employees` schema could not be confirmed beyond code/migration evidence;
- live RLS policy state could not be queried;
- live storage buckets could not be listed;
- live duplicate email/account mapping counts could not be produced.

This document separates repository evidence from live database checks that must run before migration approval.

## 4. Current Identity Model

### Repository-Evidenced Current State

| Area | Current behavior after Batch 2 | Evidence | Risk |
|---|---|---|---|
| Auth session | Supabase Auth session is verified server-side through `supabase.auth.getUser()`. | `services/server/auth.ts` | Good interim authentication source. |
| Auth-to-employee mapping | `auth.users.email -> employees.email`. | `services/server/auth.ts` | Compatibility mapping only; email can be duplicated, changed, or absent. |
| Employee internal identity | Code uses `employees.id` for most attendance/profile paths. | `app/api/staff/attendance/route.ts`, `app/api/staff/profile/route.ts` | Good target internal key, but schema constraints unknown. |
| Employee business code | `employees.employee_id` is optional and sometimes used for workflow assignment matching. | `lib/types/employee.ts`, `services/staffTasksService.ts` | Must remain business/display/integration code, not auth identity. |
| Display name | `full_name`, `employee_name`, `assignee_name`, `requested_by` are still used as display and sometimes relationship values. | `app/admin/capital/page.tsx`, `services/staffExpensesService.ts`, workflow files | High relationship ambiguity risk. |
| Staff QR token | `/api/check-in` still looks up `employees.qr_token`. | `app/api/check-in/route.ts` | QR token is long-lived if current schema stores it directly. |
| Role source | `employees.role` and `is_manager` are read in code. | `services/server/auth.ts`, cron/admin files | Role model exists in employee row but lacks policy/permission tables. |
| Account creation | Only `signInWithPassword` usage was found; no `signUp`, invite, or `auth.admin.createUser` flow in repo. | `app/admin/AdminLoginForm.tsx`, `app/staff/StaffLoginForm.tsx` | Account provisioning process is undocumented. |

### Current Identity Gaps

- No repository evidence that `employees.auth_user_id` exists.
- No repository evidence of a unique constraint on `employees.email`.
- No repository evidence of a unique constraint on `employees.employee_id`.
- No repository evidence of a formal role/permission/scope table.
- No repository evidence of an audit log table.
- No repository evidence of identity-link audit history.

## 5. Target Identity Model

Canonical identity path:

```text
Authenticated Supabase session
-> auth.users.id
-> employees.auth_user_id
-> employees.id
-> system role + action permission + record scope
```

Rules:

- `employees.id` remains the internal operational primary key and long-term FK.
- `employees.auth_user_id` references `auth.users.id`, is nullable, and is unique when not null.
- `employees.employee_id` remains a business code for display/search/integration, not an auth identity.
- `full_name` remains display-only and may be kept as a historical snapshot on records.
- No authorization decision may trust `employeeId`, `userId`, `role`, permission, payroll scope, or project membership from client input.
- Server/RLS derives identity from `auth.uid()` and the employee mapping.
- Role and permission must be readable by trusted server/RLS logic, not by client local state.

## 6. Current Schema Inventory From Repository Evidence

| Table or resource | Repository schema evidence | Inferred current columns from code | RLS evidence in repo | Confidence |
|---|---|---|---|---|
| `employees` | No table migration in repo. | `id`, `employee_id`, `full_name`, `email`, `title`, `status`, `role`, `is_manager`, `is_active`, `branch`, `branch_code`, `phone`, `bank_name`, `bank_account_number`, `hourly_rate`, `base_salary_per_hour`, `qr_token`, `address`, `cccd`, `drive_cccd`, `drive_contract`, `level`. | None. | Medium from code, low for constraints. |
| `attendance` | No table migration in repo. | `id`, `employee_id`, `employee_name`, `work_date`, `shift_name`, `check_in`, `check_out`, `total_hours`, `total_salary`, `status`. | None. | Medium from code. |
| `attendance_logs` | No table migration in repo. | `id`, `employee_id`, `check_in_time`, `check_out_time`, `latitude`, `longitude`, `status`, `hours_worked`, `earnings_today`. | None. | Medium from code. |
| `attendance_corrections` | No table or code evidence. | Not present. | None. | High absence in repo, live DB unknown. |
| `payroll_runs` / `payroll_items` | No table or code evidence. | Not present. Payroll is currently derived in UI and ledger settlement. | None. | High absence in repo, live DB unknown. |
| `wage_rate_history` | No table or code evidence. | Not present. Current rate sources are employee fields and metadata. | None. | High absence in repo, live DB unknown. |
| `payroll_adjustments` | No table or code evidence. | Not present. | None. | High absence in repo, live DB unknown. |
| `financial_ledger` | No table migration in repo. | `id`, `type`, `sub_type`, `category`, `amount`, `bill_url`, `requested_by`, `is_paid`, `month_period`, `expense_source`. | None. | Medium from code. |
| `projects` | Migration creates/alters table. | `id`, `name`, `project_deadline`, `drive_link`, `created_at`. | RLS enabled, public `for all` policy. | High. |
| `phases` | Migration creates/alters table. | `id`, `project_id`, `name`, `order_index`, `status`, colorway/stage fields, dates, progress, next_action, required_review. | RLS enabled, public `for all` policy. | High. |
| `tasks` | Migration creates/alters table. | `id`, `phase_id`, `name`, `assignee`, `assignee_id`, `assignee_name`, `deadline`, `note`, `status`, `created_at`. | RLS enabled, public `for all` policy. | High. |
| Project members | No table evidence. | Not present. | None. | High absence in repo, live DB unknown. |
| Audit logs | No table evidence. | Not present. | None. | High absence in repo, live DB unknown. |
| File metadata | No table evidence. | File URLs are stored as freeform fields such as `drive_cccd`, `drive_contract`, `bill_url`, `drive_link`. | None. | Medium from code. |
| Storage buckets | No Supabase Storage API or migration evidence. | Unknown. | None. | Low; live DB required. |
| `system_settings` | Referenced by code and migration source. | `key`, `value`, `config_name`, `group_name`, `description`, SMTP/company bank/workflow config. | None in repo. | Medium from code. |
| `system_metadata` | Referenced by code. | `id`, `name`, `data`. | None in repo. | Medium from code. |
| `email_templates` / `email_history` | Referenced by code. | Template/history fields inferred only. | None in repo. | Low-medium from code. |
| `facilities` | Referenced by code. | `id`, `name`, `facility_name`, `code`, `lat`, `lng`, `radius`. | None in repo. | Medium from code. |

## 7. RLS Inventory Matrix

Live DB must be queried before migration. The table below records repository evidence only.

| Resource | RLS enabled? | SELECT policy | INSERT policy | UPDATE policy | DELETE policy | Role/claim currently used | Record scope | Service role usage | Gap | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| `employees` | No repo evidence. | None in repo. | None in repo. | None in repo. | None in repo. | App code reads `employees.role`; no RLS claim evidence. | None proven. | No service-role usage in production code. | Sensitive profile, bank, role, QR token, wage fields lack repo policy evidence. | Critical. |
| `attendance` | No repo evidence. | None in repo. | None in repo. | None in repo. | None in repo. | Batch 2 server routes use session; legacy services still browser singleton. | Staff route scopes by employee server-side; DB policy unknown. | None. | Attendance and salary totals may be reachable if table exposed. | Critical. |
| `attendance_logs` | No repo evidence. | None in repo. | None in repo. | None in repo. | None in repo. | `/api/check-in` trusts `qr_token`; checkout route uses server session after Batch 2. | Partial server scope only. | None. | Event evidence lacks DB policy and QR bootstrap is long-lived. | Critical. |
| Attendance corrections | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | Required domain table absent. | High. |
| Payroll runs/items | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | Payroll source/output not modeled; UI/ledger settlement remains compatibility path. | Critical. |
| Wage/rate history | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | Rates are mutable fields/metadata without append-only history. | Critical. |
| Adjustments | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | Adjustments not modeled as approved payroll input. | High. |
| Expenses | No dedicated expenses table found; staff expenses use `financial_ledger`. | None in repo. | None in repo. | None in repo. | None in repo. | Full name relationship. | None proven. | None. | Staff expense relationship uses `requested_by = full_name`. | High. |
| Finance / `financial_ledger` | No repo evidence. | None in repo. | None in repo. | None in repo. | None in repo. | Client admin pages and staff services write/read. | Name/month filters in app only. | None. | Finance data lacks DB policy evidence and stable employee relation. | Critical. |
| `projects` | Yes in repo. | `for all to anon, authenticated using true`. | Same policy via `for all`. | Same policy via `for all`. | Same policy via `for all`. | No identity claim. | Global public. | None. | RLS exists but permits all anon/auth access. | Critical for internal projects. |
| `phases` | Yes in repo. | `for all to anon, authenticated using true`. | Same. | Same. | Same. | No identity claim. | Global public. | None. | RLS exists but permits all anon/auth access. | Critical for workflow. |
| `tasks` | Yes in repo. | `for all to anon, authenticated using true`. | Same. | Same. | Same. | No identity claim. | Global public. | None. | Assignments can expose staff work and operational notes. | Critical. |
| Project members | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | No record-scope model for project access. | High. |
| Audit logs | Not found. | N/A. | N/A. | N/A. | N/A. | N/A. | N/A. | None. | No append-only audit record. | High. |
| File metadata | No dedicated table found. | None. | None. | None. | None. | N/A. | N/A. | None. | Sensitive file links are plain text fields; access depends on external URL security. | High. |
| Storage buckets | No repo evidence. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | Unknown. | None. | Bucket privacy and `storage.objects` policies are unverified. | Critical if sensitive files are stored in public buckets. |

## 8. Target Authorization Model

Model layers:

1. Authenticated identity: Supabase Auth session, `auth.uid() is not null`.
2. Employee mapping: `employees.auth_user_id = auth.uid()`.
3. System role: `employees.role` initially, future normalized `roles`/`employee_roles`.
4. Action permission: explicit permission key such as `attendance.view_own`, `payroll.view_all`, `finance.view`.
5. Record scope: own, team, project, branch, all, or explicit resource membership.

Do not trust:

- request body `employeeId`;
- request body `userId`;
- request body `role`;
- client-side project membership state;
- full name, assignee display name, or requested-by name as relationship authority.

Recommended implementation shape:

- Add helper functions in DB or server boundary after schema approval:
  - `public.current_employee_id() returns bigint`
  - `public.current_employee_role() returns text`
  - `public.has_permission(permission_key text, resource_type text default null, resource_id bigint default null) returns boolean`
- Prefer stable SQL predicates in RLS:
  - Own employee row: `auth.uid() is not null and auth.uid() = employees.auth_user_id`
  - Own attendance: `employee_id = public.current_employee_id()`
  - Admin/payroll/finance: `public.has_permission(...)`
- Avoid `raw_user_meta_data` / user metadata for authorization.
- Use `WITH CHECK` anywhere a row can be inserted or updated with ownership fields.

## 9. Target Policy Matrix

| Role / permission | Employees | Attendance | Attendance corrections | Payroll output | Wage/rate history | Finance/expenses | Projects/tasks | Audit logs | Storage |
|---|---|---|---|---|---|---|---|---|---|
| Anonymous | Deny all internal data. | Deny. | Deny. | Deny. | Deny. | Deny. | Deny after replacing current public policies. | Deny. | Deny private buckets. |
| Staff | Read limited own profile; update own allowed contact/bank fields via server/RLS. | Read own; create/update own only through constrained server path or strict policy. | Submit own correction. | Read own approved payslip only if enabled. | Deny raw history except own payslip-derived display if approved. | Read/create own expense submissions only. | Read assigned work; update only assigned task progress fields if permitted. | Deny direct read/write. | Read/upload own allowed docs/attachments by path/metadata policy. |
| Project Manager | Read scoped staff/project records only. | View team/project scope if permission granted. | Approve scoped corrections if not own request. | No default payroll. | Deny by default. | No default finance unless granted. | Manage scoped projects/tasks. | Deny unless audit permission. | Scoped project files only. |
| Payroll/Finance | Read employees needed for payroll/finance scope. | Read approved attendance inputs for scope. | View approved corrections for payroll; no approve unless permission granted. | Read/calculate/mark paid by permission scope. | Read applicable wage/rate history by scope. | Manage finance by scope. | No default workflow admin. | Append via server; read only with audit permission. | Payroll/finance private buckets by permission. |
| Admin | Manage employees, roles, settings with audit. | Manage attendance with audit. | Approve/manage by permission. | Manage by explicit payroll permissions. | Manage rates with audit. | Manage finance if permission granted. | Manage workflow. | Read with audit permission; append only via server. | Manage bucket metadata/files by permission. |
| Owner | Broad high-scope permission by explicit role/permission. | Broad. | Broad. | Broad. | Broad. | Broad. | Broad. | Broad read; append-only writes. | Broad internal access. |
| Service/Cron | Server-only secret/sessionless trusted operation. | Only approved scheduled tasks. | N/A. | Approved payroll jobs. | N/A. | Approved settlement jobs. | N/A. | Append operational audit. | Server-only signed URL generation if approved. |

## 10. Proposed Schema Diff

This is a design diff, not an executed migration.

### Employees

Add:

- `employees.auth_user_id uuid null references auth.users(id) on delete set null`
- unique partial index on `employees.auth_user_id where auth_user_id is not null`
- optional normalized email helper index for backfill validation: `lower(trim(email))`
- optional uniqueness on `employees.employee_id` only after duplicate audit passes

Keep:

- `employees.id` as internal primary key.
- `employees.employee_id` as business code.
- `employees.full_name` as display.
- legacy `employees.email` during compatibility.

Do not drop:

- `full_name`
- `employee_id`
- historical display snapshots
- `qr_token` in first migration; deprecate only after QR redesign approval.

### Authorization Tables

Add after approval:

- `role_permissions`
- `employee_permissions` or `employee_role_assignments`
- `record_scopes`
- optional `project_members`
- `audit_logs`

Minimum role/permission design:

```text
role_permissions(role, permission_key, scope_kind, created_at)
employee_permissions(employee_id, permission_key, scope_kind, resource_type, resource_id, created_by, created_at, revoked_at)
project_members(project_id, employee_id, role, created_by, created_at)
audit_logs(actor_auth_user_id, actor_employee_id, action, resource_type, resource_id, old_values, new_values, reason, source, elevated, correlation_id, created_at)
```

### Attendance and Payroll

Add after approval:

- `attendance_corrections`
- `wage_rate_history`
- `payroll_runs`
- `payroll_items`
- `payroll_adjustments`

Compatibility:

- Keep current `attendance` table readable.
- Keep current `attendance_logs` readable.
- Do not switch payroll source until fixtures and output comparison are approved.
- Add nullable stable references first, then backfill, then constraints.

### Finance

Add after approval:

- `financial_ledger.employee_id bigint null references employees(id)` for staff-related rows.
- keep `requested_by` as display snapshot.
- optional `source_type`, `source_id`, `payroll_run_id`, `payroll_item_id` when payroll settlement source exists.

### Workflow

Add after approval:

- replace permissive public policies on `projects`, `phases`, `tasks`.
- add or validate stable `tasks.assignee_id` references `employees(id)`.
- keep `assignee_name`/`assignee` as display snapshots.
- add `project_members` for scope.

### Storage

Add after approval:

- private buckets for sensitive categories:
  - `staff-documents`
  - `payroll-files`
  - `attendance-attachments`
  - `invoices`
  - `project-source-files`
  - `unreleased-artwork`
  - `production-formulas`
- `file_metadata` table if application needs search/audit across files:
  - `id`, `bucket_id`, `object_path`, `owner_employee_id`, `resource_type`, `resource_id`, `classification`, `created_by`, `created_at`, `deleted_at`
- RLS on `storage.objects` keyed by bucket and path/metadata.

## 11. Pseudo-Migration SQL Draft

Do not run this SQL before approval. Generate an actual migration with `supabase migration new ...` only after approval.

```sql
-- Batch 3 draft only. Do not run.

begin;

-- 1. Identity link.
alter table public.employees
  add column if not exists auth_user_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_auth_user_id_fkey'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists employees_auth_user_id_uidx
  on public.employees(auth_user_id)
  where auth_user_id is not null;

create index if not exists employees_email_normalized_idx
  on public.employees ((lower(trim(email))))
  where email is not null and trim(email) <> '';

-- Add this only after duplicate employee_id audit passes.
-- create unique index if not exists employees_employee_id_uidx
--   on public.employees(employee_id)
--   where employee_id is not null;

-- 2. Minimal permission scaffolding. Names are draft.
create table if not exists public.role_permissions (
  id bigint generated by default as identity primary key,
  role text not null,
  permission_key text not null,
  scope_kind text not null default 'all',
  created_at timestamptz not null default now(),
  unique (role, permission_key, scope_kind)
);

create table if not exists public.employee_permissions (
  id bigint generated by default as identity primary key,
  employee_id bigint not null references public.employees(id) on delete cascade,
  permission_key text not null,
  scope_kind text not null default 'own',
  resource_type text null,
  resource_id bigint null,
  created_by bigint null references public.employees(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create table if not exists public.project_members (
  id bigint generated by default as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  employee_id bigint not null references public.employees(id) on delete cascade,
  role text not null default 'member',
  created_by bigint null references public.employees(id),
  created_at timestamptz not null default now(),
  unique (project_id, employee_id)
);

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_auth_user_id uuid null references auth.users(id) on delete set null,
  actor_employee_id bigint null references public.employees(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text null,
  old_values jsonb null,
  new_values jsonb null,
  reason text null,
  source text null,
  elevated boolean not null default false,
  correlation_id uuid null,
  created_at timestamptz not null default now()
);

-- 3. Payroll/attendance source scaffolding. Add only after table names are approved.
create table if not exists public.attendance_corrections (
  id bigint generated by default as identity primary key,
  attendance_id bigint null,
  attendance_log_id bigint null,
  employee_id bigint not null references public.employees(id),
  requested_by bigint not null references public.employees(id),
  old_values jsonb null,
  requested_values jsonb not null,
  reason text not null,
  status text not null default 'PENDING',
  reviewed_by bigint null references public.employees(id),
  reviewed_at timestamptz null,
  review_note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.wage_rate_history (
  id bigint generated by default as identity primary key,
  employee_id bigint not null references public.employees(id),
  rate_type text not null,
  amount numeric not null,
  effective_from date not null,
  effective_to date null,
  created_by bigint null references public.employees(id),
  created_at timestamptz not null default now(),
  reason text null
);

create table if not exists public.payroll_runs (
  id bigint generated by default as identity primary key,
  period text not null,
  status text not null default 'DRAFT',
  calculated_by bigint null references public.employees(id),
  approved_by bigint null references public.employees(id),
  approved_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.payroll_items (
  id bigint generated by default as identity primary key,
  payroll_run_id bigint not null references public.payroll_runs(id) on delete cascade,
  employee_id bigint not null references public.employees(id),
  total_hours numeric null,
  total_salary numeric not null default 0,
  payment_status text not null default 'UNPAID',
  source_summary jsonb null,
  created_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create table if not exists public.payroll_adjustments (
  id bigint generated by default as identity primary key,
  payroll_item_id bigint null references public.payroll_items(id) on delete cascade,
  employee_id bigint not null references public.employees(id),
  amount numeric not null,
  reason text not null,
  status text not null default 'PENDING',
  created_by bigint null references public.employees(id),
  approved_by bigint null references public.employees(id),
  created_at timestamptz not null default now()
);

alter table public.financial_ledger
  add column if not exists employee_id bigint null references public.employees(id),
  add column if not exists source_type text null,
  add column if not exists source_id bigint null;

-- 4. RLS enablement will be staged separately after dry-run checks.
-- alter table public.employees enable row level security;
-- alter table public.attendance enable row level security;
-- ...

commit;
```

## 12. Backfill Plan

### 12.1 Identity Backfill Categories

Backfill must produce three lists before updating data:

| Category | Definition | Action |
|---|---|---|
| Map chắc chắn | Exactly one `auth.users.email` matches exactly one active `employees.email` after normalization. | Auto-map only after dry-run approval. |
| Map cần kiểm tra | Email exists but has casing/space mismatch, inactive employee, multiple auth identities, multiple employee rows, missing status clarity, or provider ambiguity. | Manual review; no automatic update. |
| Không thể map | Auth user has no employee, employee has no auth account, missing email, invalid email, duplicate email unresolved. | Leave `auth_user_id` null; create onboarding/provisioning tasks. |

Email normalization:

```text
lower(trim(email))
```

Do not use `full_name` as the final matching key. Full name may be displayed in review reports only.

### 12.2 Duplicate Handling

Duplicate employee emails:

1. Find duplicates by normalized employee email.
2. Stop auto-backfill for every duplicate group.
3. Assign owner/admin manual decision:
   - merge duplicate employee records;
   - keep one active employee and mark others inactive;
   - assign separate unique emails;
   - leave unlinked until resolved.

Duplicate auth emails or multiple identities:

1. Identify duplicate normalized emails in `auth.users`.
2. Stop auto-backfill.
3. Decide which auth account is active and should own the ERP employee link.
4. Revoke or archive unused accounts using Supabase Auth admin process after approval.

Accounts without employees:

- Keep auth account unlinked.
- Deny ERP access until employee row exists and is linked.
- Report for admin provisioning.

Employees without accounts:

- Keep `auth_user_id = null`.
- Staff cannot log in until Supabase Auth account is created.
- QR/shared-device bootstrap, if needed, must follow the QR design in this document.

### 12.3 Backfill Dry-Run Queries

Run in SQL editor or trusted DB session before migration. Do not run as migration until approved.

```sql
-- Employees with duplicate normalized email.
select lower(trim(email)) as normalized_email, count(*) as employee_count,
       array_agg(id order by id) as employee_ids
from public.employees
where email is not null and trim(email) <> ''
group by lower(trim(email))
having count(*) > 1;

-- Auth users with duplicate normalized email.
select lower(trim(email)) as normalized_email, count(*) as auth_user_count,
       array_agg(id order by created_at) as auth_user_ids
from auth.users
where email is not null and trim(email) <> ''
group by lower(trim(email))
having count(*) > 1;

-- Exact one-to-one candidate mappings.
with employee_email as (
  select id as employee_id, lower(trim(email)) as normalized_email
  from public.employees
  where email is not null and trim(email) <> ''
),
employee_unique as (
  select normalized_email, min(employee_id) as employee_id, count(*) as employee_count
  from employee_email
  group by normalized_email
),
auth_email as (
  select id as auth_user_id, lower(trim(email)) as normalized_email
  from auth.users
  where email is not null and trim(email) <> ''
),
auth_unique as (
  select normalized_email, min(auth_user_id) as auth_user_id, count(*) as auth_user_count
  from auth_email
  group by normalized_email
)
select eu.employee_id, au.auth_user_id, eu.normalized_email
from employee_unique eu
join auth_unique au using (normalized_email)
where eu.employee_count = 1
  and au.auth_user_count = 1;

-- Employees without auth account.
select e.id, e.email, e.full_name
from public.employees e
left join auth.users u on lower(trim(u.email)) = lower(trim(e.email))
where e.email is null
   or trim(e.email) = ''
   or u.id is null;

-- Auth accounts without employee.
select u.id, u.email, u.created_at
from auth.users u
left join public.employees e on lower(trim(e.email)) = lower(trim(u.email))
where e.id is null;
```

### 12.4 Backfill Update Draft

Only after reviewing duplicate reports:

```sql
-- Draft only.
with candidate as (
  -- reuse one-to-one query from above
  select eu.employee_id, au.auth_user_id
  from ...
)
update public.employees e
set auth_user_id = candidate.auth_user_id
from candidate
where e.id = candidate.employee_id
  and e.auth_user_id is null;
```

## 13. RLS Policy Plan

These policies are conceptual until table names and helper functions are approved.

### 13.1 Helper Functions

```sql
-- Draft only. Security model must be reviewed before use.
create or replace function public.current_employee_id()
returns bigint
language sql
stable
security invoker
as $$
  select e.id
  from public.employees e
  where e.auth_user_id = (select auth.uid())
  limit 1
$$;

create or replace function public.current_employee_role()
returns text
language sql
stable
security invoker
as $$
  select e.role
  from public.employees e
  where e.auth_user_id = (select auth.uid())
  limit 1
$$;
```

If a `SECURITY DEFINER` permission helper is later required to bypass recursive RLS, it must live in a controlled schema, set `search_path`, include explicit `auth.uid()` checks, and pass advisors/security review before migration.

### 13.2 Employees

- Staff SELECT: own limited profile only. If column-level privacy is needed, expose a view or server route, because RLS is row-level, not field-level.
- Staff UPDATE: own allowed self-service fields only through server route or column-level restriction strategy. Do not allow role, rate, bank ownership, `auth_user_id`, `qr_token`, or status mutation from client.
- Admin/Owner SELECT/INSERT/UPDATE/DELETE: permission checked and audited.
- No anonymous access.

### 13.3 Attendance and Attendance Logs

- Staff SELECT own records: `employee_id = current_employee_id()`.
- Staff INSERT/UPDATE: prefer server route. If direct policy is needed, `WITH CHECK (employee_id = current_employee_id())` and block payroll-sensitive fields from client.
- Manager/Admin SELECT: only with `attendance.view_team` or `attendance.view_all` permission.
- Corrections must be separate from raw attendance mutation.
- Payroll reads only approved attendance/correction data.

### 13.4 Attendance Corrections

- Staff INSERT own correction request only.
- Staff SELECT own requests.
- Staff cannot approve own request.
- Manager/Admin approval requires `attendance.approve_correction` and record scope.
- DELETE denied except privileged audited server operation.

### 13.5 Payroll, Wage/Rate, Adjustments

- Staff can SELECT only own approved payslip output fields.
- Staff cannot SELECT raw wage/rate history by default.
- Project Manager has no payroll visibility by default.
- Payroll/Finance/Admin require explicit permission for broad payroll/rate access.
- Wage/rate INSERT/UPDATE requires `payroll.calculate` or `role.manage` equivalent plus audit.
- Locked payroll cannot change due to wage/rate edits without explicit unlock/recalculation process.

### 13.6 Finance and Expenses

- Staff can INSERT own expense submission only with `employee_id = current_employee_id()`.
- Staff can SELECT own expense submissions.
- Finance/Admin can SELECT/UPDATE/mark paid with `finance.view` / finance manage permissions.
- Keep `requested_by` as display snapshot; authorize by `employee_id`.

### 13.7 Projects, Phases, Tasks, Project Members

Current public policies must be replaced after migration approval.

- Anonymous denied.
- Staff SELECT assigned tasks and project/member-visible context.
- Staff UPDATE only allowed task-progress fields for assigned tasks if permitted.
- Project Manager SELECT/UPDATE scoped to `project_members`.
- Admin/Owner broad access with permission.
- `tasks.assignee_id` should reference `employees.id`; `assignee_name` remains display snapshot.

### 13.8 Audit Logs

- INSERT only through trusted server operations.
- No user UPDATE or DELETE.
- SELECT only Admin/Owner/Auditor with `audit.view`.
- Consider append-only enforcement by policy plus restricted grants.

### 13.9 Storage

All sensitive buckets should be private:

- `staff-documents`
- `payroll-files`
- `attendance-attachments`
- `invoices`
- `project-source-files`
- `unreleased-artwork`
- `production-formulas`

Policy approach:

- Store path convention: `{resource_type}/{resource_id}/{uuid-or-filename}` or `{employee_id}/...` where ownership is not guessable alone.
- Enforce ownership/scope by `storage.objects.bucket_id`, object path, and/or `file_metadata`.
- Use signed URLs for time-limited downloads; do not expose public URLs for sensitive assets.
- Public buckets only for intentionally public marketing/media assets, not ERP staff/payroll/production formulas.

## 14. QR Check-In Threat Model and Design

### Current Threats

| Threat | Current or potential issue | Required mitigation |
|---|---|---|
| Long-lived QR token leak | `employees.qr_token` lookup grants identity to `/api/check-in`. | Replace with short-lived token or authenticated session. |
| URL/localStorage persistence | Staff portal token flow was removed in Batch 2; QR must not reintroduce it. | Never store QR token in URL/localStorage/sessionStorage. |
| Replay | Same QR token can be reused if long-lived. | Nonce/event ID and expiry, single-use redemption. |
| Client identity spoofing | Client could submit employee ID if accepted. | Server derives identity from session or server-side QR redemption. |
| Shared device | Employee may not have personal session on shared device. | Separate bootstrap threat model and explicit approval. |
| Token logs | QR payload could appear in browser/server logs. | Do not log token; use opaque token hash server-side. |

### Option A: Authenticated QR Check-In

- User signs in with Supabase Auth.
- QR identifies a facility/check-in event, not employee identity.
- Server derives employee from session.
- QR token contains event ID/nonce and expiry.
- Server validates event, location, nonce, expiry, and employee eligibility.
- Best security posture; requires every staff member to have an account/session.

### Option B: Shared Device Bootstrap

Use only if business requires employees without personal login.

- Admin starts a check-in kiosk session on trusted device.
- QR token represents a short-lived check-in challenge, not a long-term staff credential.
- Employee selects/identifies themselves through a server-mediated flow.
- Server creates an attendance event only after validating challenge, expiry, location, and optional second factor/PIN.
- Replay table stores used nonces.
- Kiosk session is scoped to facility/time window and cannot access staff portal/payroll/profile.

### Proposed QR Tables

```text
qr_checkin_challenges(
  id uuid primary key,
  token_hash text unique not null,
  facility_id bigint null,
  purpose text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  consumed_by_employee_id bigint null,
  created_by bigint null,
  created_at timestamptz not null default now()
)
```

Do not implement QR schema until bootstrap contract is approved.

## 15. Compatibility Plan

- Keep `employees.email` mapping in server code until `auth_user_id` backfill is complete and validated.
- Add `auth_user_id` nullable first; do not require all employees to have accounts.
- Keep display snapshots (`full_name`, `employee_name`, `assignee_name`, `requested_by`) for historical readability.
- Add stable IDs beside legacy fields before switching readers.
- Do not drop `qr_token` in first migration; make QR flow read-only/deprecated after new QR challenge model is approved.
- Keep current payroll calculation and current payroll source until regression fixtures prove behavior.
- Replace public workflow RLS policies only after project/member scopes are present or a server-only transition path is approved.

## 16. Rollback Plan

Schema rollback draft:

```sql
-- Draft only. Use only after rollback approval.
begin;

drop table if exists public.payroll_adjustments;
drop table if exists public.payroll_items;
drop table if exists public.payroll_runs;
drop table if exists public.wage_rate_history;
drop table if exists public.attendance_corrections;
drop table if exists public.audit_logs;
drop table if exists public.project_members;
drop table if exists public.employee_permissions;
drop table if exists public.role_permissions;

drop index if exists public.employees_auth_user_id_uidx;
drop index if exists public.employees_email_normalized_idx;

alter table public.financial_ledger
  drop column if exists employee_id,
  drop column if exists source_type,
  drop column if exists source_id;

alter table public.employees
  drop constraint if exists employees_auth_user_id_fkey,
  drop column if exists auth_user_id;

commit;
```

RLS rollback:

- Keep old policies scripted before replacement.
- Restore previous project/phases/tasks permissive policies only as emergency rollback, with documented exposure risk.
- Disable new restrictive policies only if server route fallback is ready.

Data rollback:

- `auth_user_id` backfill is lossless if old email fields remain.
- New audit logs and history tables can be retained even if app rolls back.
- Dropping new payroll/history tables loses newly captured audit/history data; prefer retain-and-ignore over drop in production rollback.

## 17. Data-Loss and Lockout Risks

| Risk | Cause | Mitigation |
|---|---|---|
| Staff lockout | Employee has no Supabase Auth account or no matching `auth_user_id`. | Keep nullable `auth_user_id`; produce employee-without-account report; staged rollout. |
| Wrong account linked | Duplicate/mis-typed email. | One-to-one only auto-map; duplicates manual review. |
| Admin lockout | Admin employee missing role/permission after RLS. | Pre-create Owner/Admin permission and verify with break-glass service path before enabling RLS. |
| Payroll behavior drift | Switching source from `attendance` to event evidence. | Do not switch source in Batch 3; require fixtures/comparison. |
| Public workflow outage | Replacing permissive project policies before membership exists. | Add `project_members` and server route compatibility first. |
| File access breakage | Moving sensitive URLs to private buckets. | Inventory files, create signed URL service, migrate metadata first. |
| Irreversible audit/history loss | Dropping new history tables on rollback. | Retain history tables during rollback where possible. |

## 18. Validation Queries Before Migration Approval

```sql
-- Current columns.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'employees', 'attendance', 'attendance_logs', 'financial_ledger',
    'projects', 'phases', 'tasks', 'system_settings', 'system_metadata'
  )
order by table_name, ordinal_position;

-- Current RLS flags.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname in ('public', 'storage')
order by schemaname, tablename;

-- Current policies.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- Existing grants for sensitive tables.
select table_schema, table_name, grantee, privilege_type
from information_schema.table_privileges
where table_schema in ('public', 'storage')
  and table_name in (
    'employees', 'attendance', 'attendance_logs', 'financial_ledger',
    'projects', 'phases', 'tasks', 'objects', 'buckets'
  )
order by table_schema, table_name, grantee, privilege_type;

-- Storage buckets.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
```

## 19. Post-Migration Checks

- Every active Supabase Auth ERP user maps to zero or one employee.
- Every linked employee maps to exactly one auth user.
- Duplicate email report is empty or manually resolved.
- Staff A cannot read Staff B profile, attendance, payroll, wage/rate, expense, or files.
- Project Manager cannot read payroll by default.
- Finance can read payroll/finance only with explicit permission and scope.
- Anonymous cannot read projects/phases/tasks after public policies are replaced.
- `storage.buckets.public = false` for sensitive buckets.
- Signed URLs expire and cannot be guessed as permanent access.
- Audit logs are append-only from user perspective.
- Payroll totals remain unchanged because no calculation source switch has happened.

## 20. Security Test Matrix

| Test ID | Scenario | Expected result |
|---|---|---|
| SEC-ID-001 | Anonymous SELECT `employees`. | Denied. |
| SEC-ID-002 | Staff A SELECT own employee row. | Allowed limited row or server-shaped profile. |
| SEC-ID-003 | Staff A SELECT Staff B employee row. | Denied. |
| SEC-ID-004 | Staff A UPDATE own `role`, `auth_user_id`, `hourly_rate`, or `qr_token`. | Denied. |
| SEC-ID-005 | Staff A UPDATE own phone/bank through approved path. | Allowed if policy/server permits only safe fields. |
| SEC-ATT-001 | Staff A SELECT own attendance. | Allowed. |
| SEC-ATT-002 | Staff A SELECT Staff B attendance. | Denied. |
| SEC-ATT-003 | Staff A submits attendance as Staff B by changing request body. | Denied. |
| SEC-ATT-004 | Staff A approves own attendance correction. | Denied. |
| SEC-PAY-001 | Staff A reads own approved payslip. | Allowed if payslip feature enabled. |
| SEC-PAY-002 | Staff A reads Staff B payroll item. | Denied. |
| SEC-PAY-003 | Project Manager reads payroll without payroll permission. | Denied. |
| SEC-PAY-004 | Payroll user reads payroll outside scope. | Denied. |
| SEC-FIN-001 | Staff A reads own expense. | Allowed. |
| SEC-FIN-002 | Staff A reads finance ledger broadly. | Denied. |
| SEC-WF-001 | Anonymous reads projects/phases/tasks. | Denied after public policies replaced. |
| SEC-WF-002 | Staff A updates unassigned task. | Denied. |
| SEC-STO-001 | Guess private file URL. | Denied. |
| SEC-STO-002 | Use expired signed URL. | Denied. |
| SEC-AUD-001 | Staff tries to update/delete audit log. | Denied. |
| SEC-QR-001 | Reuse consumed QR nonce. | Denied. |
| SEC-QR-002 | Use expired QR challenge. | Denied. |

## 21. Acceptance Criteria For Batch 3 Plan

- Canonical identity path from `auth.users.id` to `employees.id` is specified.
- `full_name` is not used as relationship authority.
- `employee_id` remains a business code, not auth identity.
- `employees.auth_user_id` is nullable, FK to `auth.users.id`, and unique when present.
- RLS coverage table lists every requested sensitive resource.
- Policy matrix covers role, action, and resource scope.
- Backfill plan handles sure mappings, review-needed mappings, and unmappable records.
- Duplicate email and ambiguous mapping handling are explicit.
- Account-without-employee and employee-without-account handling is explicit.
- Rollback plan exists.
- Unauthorized access test plan exists.
- QR threat model avoids long-lived URL/localStorage/shared tokens.
- No payroll calculation change is proposed.
- No migration is run before approval.

## 22. Blocking Questions For User Decision

1. Should `employees.role` remain the initial role source for RLS helper logic, or should Batch 4 introduce normalized role tables before any RLS rollout?
2. Is email one-to-one enough for an approved dry-run backfill candidate list, or do you want a manual review for every mapping even when normalized email is unique on both sides?
3. Do staff without personal devices/accounts need QR/shared-device attendance support, or can QR check-in require authenticated staff sessions?
4. Which role is the emergency break-glass owner account for first RLS rollout?
5. Should sensitive files be migrated into Supabase private buckets, or should existing external Drive/bill links remain compatibility-only until a later storage migration?

## 23. Conflicts Between Code, Schema Evidence, and Specification

| Conflict | Current code/schema evidence | Specification target | Required resolution |
|---|---|---|---|
| Auth mapping uses email. | `services/server/auth.ts` maps `auth.users.email -> employees.email`. | `auth.users.id -> employees.auth_user_id -> employees.id`. | Add/backfill `auth_user_id`, then switch server helper and RLS. |
| Workflow RLS is public. | Migration creates `for all to anon, authenticated using true` policies. | Authenticated, role/action/scope-scoped access. | Replace policies after `project_members`/permission model exists. |
| Finance uses names. | `financial_ledger.requested_by = full_name`. | Stable employee relation plus display snapshot. | Add `financial_ledger.employee_id`, backfill, keep `requested_by` display. |
| Staff expenses use names. | `services/staffExpensesService.ts` filters/inserts by `requested_by = full_name`. | Server/RLS by `employees.id`. | Switch after `financial_ledger.employee_id` backfill. |
| Workflow assignment fallback uses names. | `assignee`, `assignee_name`, full-name fallback remain. | `tasks.assignee_id -> employees.id`, names display-only. | Backfill `assignee_id`, keep names as snapshots. |
| QR check-in uses long-lived employee token. | `/api/check-in` uses `employees.qr_token`. | Short-lived challenge or authenticated session. | Design/approve QR bootstrap schema before implementation. |
| Payroll is UI/ledger derived. | `app/admin/attendance/page.tsx` calculates payroll and writes `financial_ledger`. | Reproducible payroll run/items from approved inputs. | Add payroll schema only after calculation baseline and approval. |
| Wage/rate history absent. | Employee fields/metadata and hard-coded display wage are used. | Append-only wage/rate history. | Add history table and permission/audit plan; no payroll output change yet. |
| Audit log absent. | No audit table found. | Append-only audit for sensitive actions. | Add audit table and server write seam. |
| Storage policy absent. | File links are plain text fields; no bucket policy evidence. | Private buckets + RLS/signed URLs. | Inventory storage, add bucket/file metadata plan. |

## 24. Explicit Non-Actions In Batch 3 Step 1

- No migration file created.
- No SQL run.
- No production schema changed.
- No RLS enabled, disabled, or modified.
- No payroll calculation changed.
- No UI changed.
- No production data changed.
- No webhook created.
