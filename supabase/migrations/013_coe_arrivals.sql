create table public.coe_arrivals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  location    geography(Point, 4326),
  report_date date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.coe_arrivals enable row level security;

create policy "Members can read coe_arrivals of their groups"
  on public.coe_arrivals for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = coe_arrivals.group_id
        and gm.user_id = (select auth.uid())
    )
  );

create policy "Users can insert their own coe_arrivals"
  on public.coe_arrivals for insert
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = coe_arrivals.group_id
        and gm.user_id = (select auth.uid())
    )
  );
