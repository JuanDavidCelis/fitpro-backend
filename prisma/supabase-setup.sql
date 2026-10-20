-- ============================================================================
-- FitPro · Endurecimiento de seguridad en Supabase (ejecutar UNA vez, y de
-- nuevo si algún día `prisma db push` crea tablas nuevas).
--
-- Dónde: Supabase → SQL Editor → pegar todo → Run.
--
-- Por qué: las tablas creadas por Prisma en el schema `public` quedan SIN
-- Row Level Security. Supabase expone `public` por su API REST, y la clave
-- pública (anon/publishable) viaja dentro de la app Android. Sin RLS, esa
-- clave permitiría leer y escribir tus tablas directamente, saltándose el
-- backend. Con RLS activado y SIN políticas, la API de Supabase no devuelve
-- ni acepta nada.
--
-- No afecta a Prisma: se conecta como el dueño de las tablas (rol postgres),
-- que no queda sujeto a RLS (no usamos FORCE ROW LEVEL SECURITY).
-- ============================================================================

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;

-- Tablas que se creen más adelante nacerán sin permisos para anon/authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

-- Verificación: todas deben salir con rls_activo = true
SELECT tablename, rowsecurity AS rls_activo
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
