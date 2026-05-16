-- Permite leer perfiles de usuarios que comparten algún grupo con el autenticado.
-- Complementa "users_select_own" (no la reemplaza — PostgreSQL hace OR entre policies SELECT).
-- Necesario para getGroupMembers, DayActivitySheet, y cualquier join a la tabla users.
CREATE POLICY "users_select_group_members"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = (SELECT auth.uid())
      AND gm2.user_id = users.id
  )
);
