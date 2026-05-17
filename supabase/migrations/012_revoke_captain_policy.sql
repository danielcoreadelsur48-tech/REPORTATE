-- Auditoría de promoción en group_members
ALTER TABLE group_members
  ADD COLUMN promoted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN promoted_at timestamptz;

-- Reemplazar política de UPDATE de roles
DROP POLICY IF EXISTS "group_members_update_role" ON group_members;

-- Cualquier admin puede promover miembros → admin
CREATE POLICY "group_members_promote_to_captain"
  ON public.group_members FOR UPDATE
  USING (
    is_group_captain(group_id)
    AND role = 'member'
  )
  WITH CHECK (true);

-- Solo el creador del grupo puede revocar admins (no a sí mismo)
CREATE POLICY "group_members_revoke_captain"
  ON public.group_members FOR UPDATE
  USING (
    (SELECT created_by FROM groups WHERE id = group_id) = (SELECT auth.uid())
    AND role = 'captain'
    AND user_id != (SELECT auth.uid())
  )
  WITH CHECK (true);
