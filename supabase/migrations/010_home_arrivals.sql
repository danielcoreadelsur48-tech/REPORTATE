create table if not exists public.home_arrivals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  location    geography(Point, 4326),
  report_date date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.home_arrivals enable row level security;

create policy "ha_select" on public.home_arrivals
  for select using (
    group_id in (select group_id from group_members where user_id = (select auth.uid()))
  );

create policy "ha_insert" on public.home_arrivals
  for insert with check (
    auth.uid() = user_id and
    group_id in (select group_id from group_members where user_id = (select auth.uid()))
  );

alter publication supabase_realtime add table public.home_arrivals;
