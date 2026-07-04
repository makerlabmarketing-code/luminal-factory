# Project Context

Luminal Factory ERP is an internal factory management system.

The goal is to manage

- employees
- attendance
- production
- expenses
- facilities

---

## User Roles

Admin

- Manage employees
- Manage workflow
- Review attendance
- Review expenses
- Configure the system

Staff

- Check in
- Check out
- View assigned tasks
- Update task status
- Submit expenses
- Update profile

---

## Business Philosophy

The application is designed for internal daily operations.

Stability is more important than introducing new UI patterns.

Users are already familiar with the current interface.

Avoid changing user experience unless explicitly requested.

---

## Identity

Prefer

employee_id

instead of

full_name

for relationships.

---

## Development Goals

Reduce duplicate code.

Increase service reuse.

Improve TypeScript safety.

Keep UI stable.