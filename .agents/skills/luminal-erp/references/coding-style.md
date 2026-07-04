# Coding Style

## TypeScript

Avoid

- any
- implicit any

Always

- define interfaces
- use optional chaining
- handle null
- provide default values when necessary

---

## React

Prefer

small components

early returns

clear state names

Avoid

deep nesting

large render functions

duplicated JSX

---

## Next.js

page.tsx should remain minimal.

Business logic belongs in

- services
- hooks
- reusable utilities

---

## Supabase

Prefer shared clients.

Avoid creating duplicate clients.

Extract database access into services.

---

## Comments

Comments should explain intent.

Avoid obvious comments.

---

## Naming

Use descriptive names.

Prefer

employeeService

workflowService

attendanceService

instead of generic helper names.