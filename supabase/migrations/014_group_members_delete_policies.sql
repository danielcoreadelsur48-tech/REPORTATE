-- Un miembro puede salirse de su propio grupo
create policy "group_members_leave_self"
  on public.group_members for delete
  using (user_id = (select auth.uid()));

-- Un admin puede eliminar a cualquier miembro, excepto al creador del grupo
create policy "group_members_remove_by_captain"
  on public.group_members for delete
  using (
    user_id != (select auth.uid())
    and (select created_by from public.groups where id = group_members.group_id) != group_members.user_id
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = (select auth.uid())
        and gm.role = 'captain'
    )
  );
