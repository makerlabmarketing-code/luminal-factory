-- Add lightweight colorway/stage runtime fields to the existing workflow
-- tables. This keeps the current Project -> Phase -> Task data working while
-- allowing the UI to manage Project -> Colorway -> Stage -> Task.

alter table public.phases add column if not exists colorway_name text;
alter table public.phases add column if not exists colorway_code text;
alter table public.phases add column if not exists stage_type text;
alter table public.phases add column if not exists stage_owner text;
alter table public.phases add column if not exists planned_start_date text;
alter table public.phases add column if not exists planned_end_date text;
alter table public.phases add column if not exists actual_start_date text;
alter table public.phases add column if not exists actual_end_date text;
alter table public.phases add column if not exists progress integer not null default 0;
alter table public.phases add column if not exists next_action text;
alter table public.phases add column if not exists required_review boolean not null default false;

create index if not exists phases_project_colorway_order_idx
  on public.phases(project_id, colorway_name, order_index);

notify pgrst, 'reload schema';
