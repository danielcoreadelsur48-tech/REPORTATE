-- Habilita Supabase Realtime en custom_reports.
-- Requerido para el badge de la campana en group.tsx y para DayActivitySheet
-- (ambos suscriben a INSERT events via postgres_changes).
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_reports;
