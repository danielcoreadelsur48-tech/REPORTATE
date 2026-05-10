-- Solo el capitán del grupo puede eliminarlo
create policy "groups_delete_captain" on public.groups
  for delete using (is_group_captain(id));
