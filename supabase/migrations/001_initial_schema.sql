-- ============================================================
-- REPÓRTATE — Migración inicial
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Habilitar extensión para PostGIS (geografía)
create extension if not exists postgis;

-- ============================================================
-- TABLA: users (espejo de auth.users con datos de perfil)
-- ============================================================
create table if not exists public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  avatar_url     text,
  expo_push_token text,
  created_at     timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABLA: groups
-- ============================================================
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  avatar_url  text,
  created_by  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLA: group_members
-- ============================================================
create type group_role as enum ('captain', 'member');

create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       group_role not null default 'member',
  joined_at  timestamptz not null default now(),
  unique (group_id, user_id)
);

create index on public.group_members(group_id);
create index on public.group_members(user_id);

-- ============================================================
-- TABLA: invitations
-- ============================================================
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  token       text not null unique,
  created_by  uuid not null references public.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references public.users(id)
);

create index on public.invitations(token);

-- ============================================================
-- TABLA: reports
-- ============================================================
create type report_type as enum ('start', 'end');

create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  group_id   uuid not null references public.groups(id) on delete cascade,
  type       report_type not null,
  location   geography(Point, 4326),
  created_at timestamptz not null default now()
);

create index on public.reports(user_id, group_id, created_at);

-- ============================================================
-- TABLA: sos_events
-- ============================================================
create type sos_status as enum ('active', 'resolved');

create table if not exists public.sos_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  group_id     uuid not null references public.groups(id) on delete cascade,
  location     geography(Point, 4326),
  status       sos_status not null default 'active',
  activated_at timestamptz not null default now(),
  resolved_at  timestamptz
);

-- Habilitar Realtime en sos_events
alter publication supabase_realtime add table public.sos_events;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invitations enable row level security;
alter table public.reports enable row level security;
alter table public.sos_events enable row level security;

-- USERS: cada usuario ve y edita solo su propio perfil
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Función auxiliar: ¿es el usuario miembro del grupo?
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- Función auxiliar: ¿es el usuario capitán del grupo?
create or replace function public.is_group_captain(p_group_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'captain'
  );
$$;

-- GROUPS: miembros pueden ver grupos a los que pertenecen
create policy "groups_select_member" on public.groups
  for select using (is_group_member(id));

create policy "groups_insert_authenticated" on public.groups
  for insert with check (auth.uid() = created_by);

-- GROUP_MEMBERS: miembros ven a otros miembros del mismo grupo
create policy "group_members_select" on public.group_members
  for select using (is_group_member(group_id));

create policy "group_members_insert" on public.group_members
  for insert with check (auth.uid() = user_id or is_group_captain(group_id));

-- INVITATIONS: capitanes gestionan invitaciones; cualquiera puede consultar por token
create policy "invitations_select" on public.invitations
  for select using (
    is_group_member(group_id) or
    exists (select 1 from public.invitations i where i.token = token and i.used_at is null)
  );

create policy "invitations_insert" on public.invitations
  for insert with check (is_group_captain(group_id));

create policy "invitations_update" on public.invitations
  for update using (
    is_group_captain(group_id) or auth.uid() = used_by
  );

-- REPORTS: miembros ven sus reportes y los del grupo;
--          la ubicación solo la ven los capitanes
create policy "reports_select_member" on public.reports
  for select using (is_group_member(group_id));

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = user_id and is_group_member(group_id));

-- SOS_EVENTS: todos los miembros del grupo ven los SOS activos
create policy "sos_select_member" on public.sos_events
  for select using (is_group_member(group_id));

create policy "sos_insert_own" on public.sos_events
  for insert with check (auth.uid() = user_id and is_group_member(group_id));

create policy "sos_update_own" on public.sos_events
  for update using (auth.uid() = user_id);
