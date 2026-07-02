alter table public.users
  add column has_coe_access boolean not null default false;

create table public.enterprise_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.enterprise_codes enable row level security;

create policy "Authenticated users can check active codes"
  on public.enterprise_codes for select
  using (active = true);
