-- Permite a cualquier miembro del grupo leer todos los custom_reports del grupo.
-- Requerido para que DayActivitySheet pueda mostrar la actividad de todos los miembros,
-- no solo la del usuario autenticado.

CREATE POLICY "group_members_read_group_custom_reports"
ON custom_reports FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = (SELECT auth.uid())
  )
);
