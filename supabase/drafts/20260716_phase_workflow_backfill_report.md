# Phase Workflow Schema Slice 2 Backfill Report

Status: review draft only. No SQL has been run for this slice.

## Live Audit Snapshot

Read-only audit run on 2026-07-16:

| project_id | project_name | phase_id | phase_name | order_index | proposed_status | proposed_previous_phase_id | ambiguity |
|---:|---|---:|---|---:|---|---:|---|
| 5 | Meowhe Carboon | 1 | Giai đoạn 1 | 0 | ACTIVE | null | none |
| 6 | Meowhe Carbon Colorway | 2 | Giai đoạn 1 | 0 | ACTIVE | null | none |
| 6 | Meowhe Carbon Colorway | 3 | Giai đoạn 2 | 1 | NOT_STARTED | 2 | none |
| 6 | Meowhe Carbon Colorway | 4 | Giai đoạn 3 | 2 | NOT_STARTED | 3 | none |

Current counts:

- projects: 6
- phases: 4
- tasks: 2

## Backfill Rule

For each project:

1. If any duplicate `order_index` exists within that project:
   - set all phases in that project to `BLOCKED`
   - set `previous_phase_id = null`
   - do not guess ordering

2. If ordering is unambiguous:
   - lowest `order_index`, then lowest `id`, becomes `ACTIVE`
   - later phases become `NOT_STARTED`
   - `previous_phase_id` points to the previous phase by `(order_index, id)`

## Current Ambiguity Result

No duplicate `order_index` was found in the live snapshot above.

## Data Impact

Allowed data writes in rollout:

- `public.phases.status`
- `public.phases.previous_phase_id`
- `public.phases.updated_at`

No writes to:

- `public.projects`
- `public.tasks`
- `public.project_members`
- `public.employees`
- attendance/finance tables

No row insert/delete is expected. `public.phases` row count must remain unchanged.
