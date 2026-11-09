-- ============================================================================
-- FitPro — Row Level Security (RLS) para todas las tablas del esquema public
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================================
-- Principio: cada usuario (auth.uid()) solo ve/edita sus filas (userId = uid).
-- Las tablas de catálogo (Equipment, Exercise, Achievement) son de solo lectura
-- para usuarios autenticados.
-- ============================================================================

-- 1) Habilitar RLS en todas las tablas
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BodyMeasurement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserEquipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Exercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkoutPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkoutDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkoutExercise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkoutSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExerciseSet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProgressRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecoveryRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SleepRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserAchievement" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2) Políticas para tablas USER-SCOPED (userId = auth.uid())
-- ============================================================================

-- User (la tabla de perfil de auth, id = uid)
CREATE POLICY "user_own_data" ON public."User"
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- UserProfile
CREATE POLICY "profile_own_data" ON public."UserProfile"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- BodyMeasurement
CREATE POLICY "measurement_own_data" ON public."BodyMeasurement"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- Goal
CREATE POLICY "goal_own_data" ON public."Goal"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- UserEquipment
CREATE POLICY "userequipment_own_data" ON public."UserEquipment"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- UserPreference
CREATE POLICY "preference_own_data" ON public."UserPreference"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- WorkoutPlan
CREATE POLICY "plan_own_data" ON public."WorkoutPlan"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- WorkoutDay (acceso a través del plan del usuario)
CREATE POLICY "day_own_data" ON public."WorkoutDay"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."WorkoutPlan" wp
      WHERE wp.id = "planId" AND wp."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."WorkoutPlan" wp
      WHERE wp.id = "planId" AND wp."userId" = auth.uid()
    )
  );

-- WorkoutExercise (acceso a través del día -> plan -> userId)
CREATE POLICY "exercise_own_data" ON public."WorkoutExercise"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."WorkoutDay" wd
      JOIN public."WorkoutPlan" wp ON wp.id = wd."planId"
      WHERE wd.id = "dayId" AND wp."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."WorkoutDay" wd
      JOIN public."WorkoutPlan" wp ON wp.id = wd."planId"
      WHERE wd.id = "dayId" AND wp."userId" = auth.uid()
    )
  );

-- WorkoutSession
CREATE POLICY "session_own_data" ON public."WorkoutSession"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- ExerciseSet (acceso a través de la sesión -> userId)
CREATE POLICY "set_own_data" ON public."ExerciseSet"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."WorkoutSession" ws
      WHERE ws.id = "sessionId" AND ws."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."WorkoutSession" ws
      WHERE ws.id = "sessionId" AND ws."userId" = auth.uid()
    )
  );

-- ProgressRecord
CREATE POLICY "progress_own_data" ON public."ProgressRecord"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- RecoveryRecord
CREATE POLICY "recovery_own_data" ON public."RecoveryRecord"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- SleepRecord
CREATE POLICY "sleep_own_data" ON public."SleepRecord"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- UserAchievement
CREATE POLICY "achievement_own_data" ON public."UserAchievement"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

-- ============================================================================
-- 3) Políticas para tablas de CATÁLOGO (read-only para authenticated)
-- ============================================================================

-- Equipment: todos los usuarios autenticados pueden leer
CREATE POLICY "equipment_read" ON public."Equipment"
  FOR SELECT TO authenticated
  USING (true);

-- Exercise: todos los usuarios autenticados pueden leer
CREATE POLICY "exercise_read" ON public."Exercise"
  FOR SELECT TO authenticated
  USING (true);

-- Achievement: todos los usuarios autenticados pueden leer
CREATE POLICY "achievement_read" ON public."Achievement"
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 4) Verificación rápida (ejecutar después para confirmar)
-- ============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';