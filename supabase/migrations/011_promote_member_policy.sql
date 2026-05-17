create policy "group_members_update_role"
  on public.group_members
  for update
  using (is_group_captain(group_id))
  with check (true);
