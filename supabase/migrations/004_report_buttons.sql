-- Migration 004: Configurable report buttons per group
-- Adds report_buttons and custom_reports tables.

-- ── report_buttons ──────────────────────────────────────────────────────────

create table if not exists public.report_buttons (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups(id) on delete cascade,
  name            text not null check (char_length(name) <= 40),
  icon            text not null,
  activation_time time not null,           -- wall-clock local time HH:MM:SS
  window_minutes  integer not null default 60 check (window_minutes > 0),
  is_home_button  boolean not null default false,
  sort_order      integer not null check (sort_order between 1 and 5),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Only one active home button per group
create unique index report_buttons_one_home_per_group
  on public.report_buttons (group_id)
  where is_home_button = true and is_active = true;

-- Fast lookup for member home screen
create index report_buttons_group_active
  on public.report_buttons (group_id, is_active, sort_order);

-- Enforce max 5 active buttons per group
create or replace function public.check_report_buttons_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*)
    from public.report_buttons
    where group_id = new.group_id and is_active = true
  ) >= 5 then
    raise exception 'Máximo 5 botones activos por grupo';
  end if;
  return new;
end;
$$;

create trigger enforce_report_buttons_limit
  before insert on public.report_buttons
  for each row execute procedure public.check_report_buttons_limit();

-- ── custom_reports ───────────────────────────────────────────────────────────

create table if not exists public.custom_reports (
  id              uuid primary key default gen_random_uuid(),
  button_id       uuid not null references public.report_buttons(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  group_id        uuid not null references public.groups(id) on delete cascade,
  location        geography(Point, 4326),   -- null except for home button
  window_date     date not null,            -- local calendar date (client-sent as YYYY-MM-DD)
  activation_time time not null,            -- snapshot of button config at press time
  window_minutes  integer not null,
  created_at      timestamptz not null default now()
);

-- Fast lookup: did this user already press this button today?
create index custom_reports_lookup
  on public.custom_reports (user_id, group_id, button_id, window_date);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.report_buttons enable row level security;
alter table public.custom_reports  enable row level security;

-- report_buttons: any group member can read active buttons
create policy "rb_select" on public.report_buttons
  for select using (is_group_member(group_id));

-- only captains can create/update/delete buttons
create policy "rb_insert" on public.report_buttons
  for insert with check (is_group_captain(group_id));

create policy "rb_update" on public.report_buttons
  for update using (is_group_captain(group_id));

create policy "rb_delete" on public.report_buttons
  for delete using (is_group_captain(group_id));

-- custom_reports: all group members can read; each user inserts only their own
create policy "cr_select" on public.custom_reports
  for select using (is_group_member(group_id));

create policy "cr_insert" on public.custom_reports
  for insert with check (auth.uid() = user_id and is_group_member(group_id));
