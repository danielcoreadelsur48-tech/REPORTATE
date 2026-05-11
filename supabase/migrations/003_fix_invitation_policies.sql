-- Fix: invitations_select tenía recursión infinita (el exists referenciaba la misma tabla)
-- Fix: invitations_update no permitía que el usuario que une marque la invitación como usada

drop policy if exists "invitations_select" on public.invitations;
drop policy if exists "invitations_update" on public.invitations;

-- SELECT: miembros del grupo ven todas las invitaciones de su grupo;
--         cualquier usuario autenticado puede ver invitaciones válidas (para unirse por código)
create policy "invitations_select" on public.invitations
  for select using (
    is_group_member(group_id)
    or (auth.uid() is not null and used_at is null and expires_at > now())
  );

-- UPDATE: capitán puede gestionar sus invitaciones;
--         cualquier usuario autenticado puede marcar una invitación sin usar como usada (para unirse)
create policy "invitations_update" on public.invitations
  for update using (
    is_group_captain(group_id)
    or (auth.uid() is not null and used_at is null)
  );
