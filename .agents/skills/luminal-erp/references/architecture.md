# Architecture

## Overview

Luminal Factory ERP is built with:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase

The project consists of two primary applications:

- Admin Portal
- Staff Portal

Business logic should be isolated from presentation whenever practical.

---

## Directory Structure

app/
    admin/
    api/
    staff/

components/
lib/
services/
utils/
public/

---

## Admin

Location

app/admin/

Responsibilities

- Employee management
- Production workflow
- Attendance management
- Financial management
- Facility management
- System settings

---

## Staff

Location

app/staff/

Main entry

app/staff/portal/page.tsx

Views

- AttendanceView
- TasksView
- ExpensesView
- ProfileView

page.tsx should remain thin.

Business logic belongs in services, hooks or reusable components.

---

## Shared Layer

Prefer

- services/
- lib/types/
- utils/

Avoid duplicating business logic across Admin and Staff.

---

## Future Direction

Prefer extracting reusable services over copying logic between modules.