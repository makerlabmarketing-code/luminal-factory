<!--
Sync Impact Report
Version change: 1.0.0 -> 1.0.1
Modified principles:
- X. ERP and Storefront Boundary: clarified operational product administration
  versus public product presentation ownership
- Development Workflow and Validation: added formal specification requirement
  for high-risk domain changes
- Operational Domain Boundaries / Architecture and Data Governance: reduced
  repeated historical-interpretability wording
- Architecture and Data Governance: removed Tailwind as a constitutional
  architecture detail
Added sections: none
Removed sections: none
Templates requiring updates:
- [not required] .specify/templates/plan-template.md
- [not required] .specify/templates/spec-template.md
- [not required] .specify/templates/tasks-template.md
- [not present] .specify/templates/commands/*.md (directory absent; no command templates to update)
Runtime guidance reviewed:
- [reviewed] .agents/skills/luminal-erp/SKILL.md
- [reviewed] .agents/skills/luminal-erp/references/project-context.md
- [reviewed] .agents/skills/luminal-erp/references/architecture.md
- [reviewed] .agents/skills/luminal-erp/references/workflow.md
Follow-up TODOs: none
-->

# Luminal Factory ERP Constitution

## Core Principles

### I. Operational Correctness Before Visual Refinement
Luminal Factory ERP is an internal operational system. Changes MUST prioritize,
in order: data correctness, attendance integrity, payroll correctness,
production traceability, material and inventory integrity, financial
traceability, staff usability, then visual refinement. A visually polished
screen with uncertain operational data is a failed change. The ERP is not the
Luminal Factory public storefront, and ERP governance MUST NOT import the
storefront's cinematic motion, 3D presentation, or gallery-first priorities.

### II. Incremental Brownfield Development
This repository is an existing application. Changes MUST preserve working
behavior while improving one explicit responsibility seam at a time. Before
changing a non-trivial module, contributors MUST inspect the current
implementation, identify the authoritative data source, trace callers and
dependent views, identify business calculations, identify side effects,
identify existing validation, and name the responsibility seam being changed.
Small, reviewable tracer-bullet changes are preferred. Repository-wide rewrites
require an explicit migration plan and approved specification. The repository
MUST NOT be reorganized merely to match an idealized architecture diagram.

### III. Stable Domain Relationships
Persisted and relational references MUST use stable identifiers. Employee
display names are presentation values. Code MUST NOT use `full_name` as a
durable relationship key when `employee_id` or another stable identifier
exists, because names may change and may not be unique. Workflow statuses are
domain states, not only UI labels. Historical operational records MUST remain
interpretable when workflow definitions evolve.

### IV. Explicit Operational Domain Boundaries
Attendance, payroll, production workflow, materials, inventory, expenses,
finance, and future commerce administration are distinct operational concerns.
Attendance records are operational time evidence. Worked hours MUST derive from
authoritative attendance timestamps and approved adjustment rules. Payroll MUST
derive from approved payroll rules and authoritative operational inputs.
Production project progress and colorway-level production progress are separate
concerns. A completed workflow action and an approved result may be different
states. Expenses are operational source records, and derived financial totals
MUST come from authoritative source records. Manually editable summary totals
that can drift from source records are prohibited.

### V. Data-Driven Production Workflow
Production MUST support project and colorway-level traceability. Operational
work may be tracked by project, colorway or variant, workflow stage, workflow
status, assigned staff, timestamps, review, revision, approval, and history.
Production MUST NOT be reduced to only `not started`, `in progress`, and
`completed` when Luminal operations require more granular states. Workflow
definitions may evolve, and historical production records MUST remain
understandable after workflow changes. The final workflow state machine MUST be
approved against actual Luminal Factory production operations before
destructive schema changes. Candidate status vocabulary in guidance is
conceptual until approved and MUST NOT be treated as a final database enum.

### VI. Server-First Architecture Boundaries
Use Server Components where supported by the current Next.js architecture and
data flow. Use Client Components only when browser interaction requires them.
Operational business rules MUST live outside presentational JSX. Complex
attendance, payroll, workflow, inventory, and financial calculations MUST live
outside visual components. Supabase access MUST stay behind documented client,
data, or service boundaries where practical. Meaningful operational service
interfaces are preferred for seams such as attendance, employee, workflow,
payroll, and finance operations. These are responsibility seams, not mandatory
filenames. Abstractions that only move code without establishing a meaningful
boundary are prohibited.

### VII. Supabase Consistency and Authorization
The project MUST use one documented purpose-specific strategy for browser,
server, middleware or authentication Supabase access. Supabase environment
variable naming MUST be standardized, and multiple environment contracts MUST
NOT be maintained indefinitely without an explicit compatibility requirement.
Privileged credentials MUST remain server-only. UI visibility is not
authorization. Administrative, staff, finance, payroll, and customer-related
mutations MUST use appropriate RLS or trusted server boundaries. Before
changing current Supabase client architecture, contributors MUST inspect all
current client implementations, callers, authentication behavior, deployment
environment variables, and define compatibility behavior.

### VIII. Strict TypeScript and Explicit Domain Language
The project MUST use strict TypeScript. New `any` usage is prohibited. When a
change touches an existing `any`, it MUST be replaced when the actual shape can
be determined safely within task scope. Reusable centralized domain types are
preferred over repeated inline interfaces for the same operational concept.
Names MUST use explicit operational language, such as `employeeId`,
`attendanceRecord`, `workflowStage`, `workflowStatus`, `assignedEmployeeId`,
`workedHours`, `payrollPeriod`, and `expenseCategory`. Untrusted inputs MUST be
validated at appropriate boundaries. Database representation, domain
representation, and form input representation may differ. Unsafe type
assertions used only to silence uncertainty are prohibited.

### IX. Protect Critical Calculations
Worked-hours calculation, payroll calculation, workflow transition validation,
inventory calculations, and financial aggregation are high-value regression-test
seams. Calculation logic MUST be isolated into pure functions where practical.
Rounding rules MUST be documented when money or worked hours are affected.
Timezone and day-boundary assumptions MUST be documented when attendance is
affected. Use red-green-refactor when a stable test seam exists and the
repository has an appropriate testing path. Critical calculation logic MUST NOT
remain unprotected solely because the repository does not yet have perfect test
architecture.

### X. ERP and Storefront Boundary
Luminal Factory ERP is the operational back office. Luminal Factory Commerce is
the customer-facing storefront. ERP-owned concerns include staff, attendance,
payroll, production administration, workflow administration, project assignment,
materials and consumables, internal inventory operations, expenses, internal
financial reporting, raffle administration, commission administration, product
administration, order operations, payment and refund operations, and shipment
operations. Storefront-owned concerns include public brand experience, public
product presentation, raffle discovery and customer entry, customer-facing
account flows, customer checkout, and customer commission submission. Both
systems may eventually use the same Supabase project and compatible shared
commerce contracts. The final shared-code strategy remains open until both
repositories and the shared data model are audited. This project MUST NOT be
permanently locked into either a monorepo or two independent repositories
before that audit. ERP governs operational product administration and internal
commerce operations; the storefront governs public product presentation and
customer interaction. Shared contracts require explicit audit and approval.

### XI. UI and Operational Usability
ERP UI MUST prioritize data clarity, operational state clarity, action clarity,
scanning speed, responsive usability, then visual polish. Production statuses
MUST NOT rely only on color. Staff Portal screens MUST remain task-oriented and
mobile-usable. Tables, filters, forms, and dashboards MUST answer real
operational questions. Charts MUST NOT be added merely because a chart library
is installed. UI UX Pro Max is advisory design intelligence and ranks below
approved ERP business rules, Luminal ERP domain and architecture rules, and
operational usability and data clarity.

### XII. Validation Before Completion
Contributors MUST inspect the repository's actual package scripts before
choosing validation commands. Do not assume `typecheck`, `check`, or `test`
scripts exist. Relevant available validation MUST run before completion, and
validation MUST NOT be claimed as passed unless the command actually ran
successfully. Attendance work MUST verify check-in, check-out, duplicate
actions, missing records, day boundaries, timezone behavior, and worked-hours
calculation. Payroll work MUST verify authoritative source inputs, missing
employee mappings, rounding, adjustments when applicable, and reproducibility of
totals. Workflow work MUST verify assignment, state transitions, blocked work,
review, revision, approval, history preservation, filtering, and colorway-level
visibility. Financial work MUST verify source records, expense categorization,
aggregation, date filtering, and refunds or reversals when applicable.

## Operational Domain Boundaries

The constitution defines governance, not a final schema. It MUST NOT be read as
locking a final database schema, production workflow state machine, or shared
commerce-code strategy. Domain definitions in `.agents/skills/luminal-erp/`
remain the active reference for ERP terminology and task-specific detail.
Specifications and plans MUST name the operational concern they change and
state whether source records, derived totals, identifiers, workflow states, or
authorization boundaries are affected, consistent with Principles III and V.

## Architecture and Data Governance

Architecture decisions MUST respect the current application architecture and
documented technology boundaries while improving explicit responsibility seams.
Business rules, data access, and domain calculations MUST be separated from
visual presentation when the task scope exposes those responsibilities.
Supabase access patterns, environment variables, privileged credentials, and RLS
or trusted server boundaries MUST be reviewed before any change that affects
authentication or authorization. Durable relationships and historical
interpretability are governed by Principles III and V.

## Development Workflow and Validation

Specifications and implementation plans MUST comply with this constitution. A
proposed task that conflicts with the constitution MUST resolve the conflict
explicitly before implementation. Non-trivial work MUST use an inspect, model,
seam, specify, implement, validate, and review workflow. Validation must be
selected from the actual repository scripts and relevant operational checks.
Formal specifications are required for changes to production workflow states,
attendance semantics, payroll rules, inventory semantics, finance
source-of-truth rules, shared ERP and storefront commerce contracts, and major
Staff Portal workflows. Small internal refactors with unchanged behavior may
use a focused task plan instead.
Application code MUST NOT be considered complete when critical calculations,
authorization boundaries, or historical traceability have unresolved
regression-risk gaps.

## Governance

This constitution is durable repository governance for Luminal Factory ERP and
supersedes conflicting lower-authority practices. Amendments MUST be
intentional, reviewable, and recorded with a semantic version change.
Specifications, plans, tasks, code review, and agent guidance MUST check
compliance against this constitution.

Versioning policy:
- MAJOR: backward-incompatible governance changes, principle removals, or
  redefinitions that change required behavior.
- MINOR: new principles or materially expanded governance.
- PATCH: clarifications, wording improvements, or non-semantic refinements.

Constitution changes MUST NOT weaken a governing principle merely to make a
current implementation easier. Overlapping principles MUST be consolidated
during amendment review. External references and advisory skills are subordinate
to this constitution, approved Luminal ERP business rules, and repository-owned
Luminal ERP guidance.

**Version**: 1.0.1 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
