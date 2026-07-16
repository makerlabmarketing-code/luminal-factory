# Phase Workflow Schema Slice 2 Threat Model

Status: review draft only. No SQL has been run for this slice.

## Assets

- `public.phases.status`
- `public.phases.previous_phase_id`
- `public.phases.assignee_employee_id`
- `public.phases.deadline`
- `public.phases.description`
- project workflow sequencing and mutation authority

## Trust Boundaries

- Browser UI may display phase state but must not be authoritative.
- Phase mutations must go through server boundary.
- Server must derive employee identity from the authenticated session.
- Client must not send `employee_id`, role, permission, actor, or workflow override authority.
- No broad browser UPDATE policy should be added in Slice 2.

## Threats And Controls

| Threat | Risk | Control in Slice 2 |
|---|---|---|
| Cross-project dependency | A phase can depend on another project phase | `prevent_invalid_phase_previous_phase()` trigger rejects mismatched `project_id` |
| Cycle in phase graph | Workflow can become impossible to evaluate | trigger recursively checks `previous_phase_id` chain |
| Ambiguous backfill | Duplicate `order_index` could create guessed sequence | backfill marks project phases `BLOCKED` and clears `previous_phase_id` |
| All phases active | UI could show parallel work incorrectly | backfill sets one `ACTIVE` phase per non-ambiguous project |
| Client-controlled assignee | User assigns inactive or unauthorized employee | app layer must only assign ACTIVE `employees.id`; no email/full_name authority |
| Client-controlled updated_at | Client forges update timestamp | `updated_at` maintained by trigger; client DTO must not accept it |
| Comment loss | Single `phases.comment` overwrites history | comment column explicitly excluded; use future `phase_comments`/activity slice |
| Broad RLS update | Browser can mutate phase state directly | no RLS policy changes in Slice 2; update remains server-boundary work |
| Deadline invalidity | deadline predates phase creation unexpectedly | check constraint rejects `deadline < created_at::date` |

## Remaining Blocks

- Server DTO for status transitions must be implemented before broad phase status mutation UI.
- Owner/Manager override requires server authorization checks against `PROJECT_MANAGE`, `PROJECT_OWNER`, or `PROJECT_MANAGER`.
- Creative Lead scope remains deferred until scoped phase/task ownership exists.
- Task assignment and comments are deferred to later slices.
