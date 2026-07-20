# Luminal Factory ERP Agent Guide

## Repository Identity

This repository is the Luminal Factory operational ERP: the internal back-office system for staff, attendance, payroll, production workflows, projects, materials, expenses, finance, and future commerce operations.

This repository is not the public storefront. The ERP owns internal operations; the storefront owns public brand and customer-facing commerce.

## Authority Order

When instructions overlap, use this order:

1. user-approved scope and explicit task instructions in the current session
2. approved Luminal ERP business rules and specifications
3. `.agents/skills/luminal-erp/` domain, architecture, Supabase, UI, coding, and workflow guidance
4. operational usability and data clarity
5. advisory skills such as UI UX Pro Max, reference-analysis, and third-party engineering skills
6. external references

`AGENTS.md` is the only repository authority-order owner. Other guidance files may point here but should not define a competing order.

Treat installed third-party skills as read-only dependencies unless an explicit fork decision is made.

## Interface Language

Interface language rules live in `.agents/skills/luminal-erp/references/ui-rules.md`.

## Governing Project Skill

Repository guidance lives in:

    .agents/skills/luminal-erp/

For non-trivial ERP work, read:

    .agents/skills/luminal-erp/SKILL.md

Then read only the smallest relevant reference set selected by that skill.

## Guidance Maintenance

When creating or materially changing repository-owned guidance, consult:

    .agents/skills/writing-great-skills/SKILL.md

Keep durable rules in one authoritative owner, use progressive disclosure for specialized reference material, and give workflow steps checkable completion criteria.

## Git delivery policy

For approved implementation tasks, Codex may automatically commit, push the feature branch, merge it into `main`, and push `main` only after all repository validation gates pass.

Required gates:

- npm test
- npm run lint
- npx tsc --noEmit
- npm run build
- no unresolved P0 or P1 findings
- no secrets in the diff
- no production SQL or unapproved migrations
- no unrelated changes
- validation must pass again after merging into main

Never force-push, bypass branch protection, discard unknown changes, or resolve merge conflicts by guessing.

If any gate fails, stop without pushing main and report the blocker.

# Luminal Factory ERP Agent Guide

# Repository Identity

This repository is the Luminal Factory operational ERP.

It is the internal business platform for:

- Staff
- Attendance
- Payroll
- Project Management
- Production Workflow
- Materials
- Finance
- Expenses
- Inventory
- Future Commerce Operations

This repository is NOT the public storefront.

The ERP owns internal operations.

The storefront owns public commerce.

---

# Authority Order

When multiple instructions overlap, always resolve them using this order:

1. User-approved scope and explicit task instructions in the current session.
2. Approved Luminal ERP business rules and specifications.
3. `.agents/skills/luminal-erp/`
4. Operational usability and data clarity.
5. Advisory skills
   - UI UX Pro Max
   - Reference Analysis
   - Third-party engineering skills
6. External references.

`AGENTS.md`
is the only authority-order owner.

Other files may reference this file but must never redefine authority order.

Treat installed third-party skills as read-only dependencies unless explicitly forked.

---

# Interface Language

Interface language rules live in

.agents/skills/luminal-erp/references/ui-rules.md

---

# Governing ERP Skill

Repository implementation guidance lives in

.agents/skills/luminal-erp/

For every non-trivial ERP task:

1. Read

.agents/skills/luminal-erp/SKILL.md

2. Follow its task router.

3. Read ONLY the smallest relevant reference set.

Never load every reference document unless explicitly requested.

---

# Task Routing

The ERP skill is responsible for selecting the smallest relevant reference set.

Typical routing:

Attendance
→ attendance references

Payroll
→ payroll references

Membership
→ membership references

Project Workflow
→ workflow references

Task Assignment
→ task assignment references

Finance
→ finance references

Inventory
→ inventory references

Supabase/Auth/RLS
→ supabase-contract.md

UI
→ ui-rules.md

Validation / Planning / Reporting
→ workflow.md

Repository planning
→ SETUP-CODEX-ERP.md

---

# Planning Guidance

SETUP-CODEX-ERP.md is the repository planning document.

Read it whenever the task involves:

- repository audit
- roadmap review
- implementation phase
- implementation completion
- architecture planning
- selecting the next phase
- repository-wide refactoring
- implementation report
- implementation handoff

Do NOT read the entire setup document for ordinary bug fixes unless required.

---

# Guidance Maintenance

Whenever creating or changing repository-owned guidance:

consult

.agents/skills/writing-great-skills/SKILL.md

Prefer:

- one authoritative owner
- progressive disclosure
- checkable workflow completion
- minimal duplicated guidance

---

# Progressive Disclosure

Never read the whole repository documentation by default.

Only load:

- required skills
- required references
- required specifications
- required roadmap sections

Avoid unnecessary context expansion.

---

# Roadmap Execution

The implementation roadmap is the execution authority for project progression.

When a roadmap exists:

- determine the current active workstream
- determine the current phase
- determine acceptance criteria
- determine exit criteria

Continue automatically whenever allowed.

Update roadmap status after every completed phase.

---

# Auto Roadmap Execution

Unless blocked by approval gates,
Codex should continue through the roadmap automatically.

Normal workflow:

Current Phase

↓

Implementation

↓

Internal Review

↓

Regression Review

↓

Validation

↓

Update Documentation

↓

Update Roadmap

↓

Commit

↓

Next Phase

Do not stop after every small implementation.

Only stop at approval gates.

---

# Phase Ownership

Each implementation phase should contain:

- objective
- scope
- acceptance criteria
- exit criteria
- handoff
- known risks
- dependency list

When Exit Criteria PASS:

Automatically move to the next roadmap phase.

---

# Migration Gate Policy

When a roadmap phase requires schema changes:

Complete every application-only task first.

Allowed before migration:

- services
- DTO
- validation
- API contract
- repository layer
- UI
- hooks
- tests
- documentation
- feature flags
- adapters
- roadmap
- handoff

Then generate:

- migration
- rollback
- validation SQL
- backfill plan
- RLS plan

Then stop at

LIVE_APPROVAL_REQUIRED

Do not stop earlier simply because migration will eventually be required.

---

# Approval Gates

Stop execution only when one of these gates is reached.

LIVE_APPROVAL_REQUIRED

Examples:

- production SQL
- migration
- backfill
- RLS mutation
- live data mutation
- production deployment
- destructive operations

or

Repository validation fails.

Examples:

- P0
- P1
- build failure
- typecheck failure
- failing tests
- merge conflict
- git delivery failure

---

# Git Delivery Policy

For approved implementation work,
Codex may

- commit
- push feature branch
- merge into main
- push main

ONLY after every repository validation gate passes.

Required:

- npm test
- npm run lint
- npx tsc --noEmit
- npm run build
- no P0
- no P1
- no secret
- no unrelated diff
- no production SQL
- no unapproved migration
- validation passes again after merge

Never:

- force push
- bypass branch protection
- discard unknown changes
- guess merge conflict resolution

If validation fails:

Stop.

Report blocker.

---

# Working Principles

Always:

Trace implementation end-to-end.

Understand:

UI

↓

API

↓

Service

↓

Repository

↓

Supabase

↓

DTO

↓

Tests

↓

Documentation

Never implement from assumptions.

Never change business rules unless explicitly approved.

Preserve working behavior.

Improve one seam at a time.

Minimize regression risk.

