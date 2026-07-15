-- Rollback Employee List Read Bridge SELECT policy.
--
-- This rollback only removes the admin employee-list SELECT policy.
-- It does not touch own-profile Staff policies, data, Auth users, or permission rows.

drop policy if exists "employees admin employee view select" on public.employees;
