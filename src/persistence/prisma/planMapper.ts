import { WorkoutPlanResult, WorkoutDayPlan, WorkoutExercisePlan } from '../../domain/types';

// ============================================================================
// Traduce entre el modelo relacional (WorkoutPlan/WorkoutDay/WorkoutExercise
// de schema.prisma) y el WorkoutPlanResult que produce el motor de reglas.
// Aislado en su propio archivo para que ni el motor ni los servicios de
// aplicación conozcan la forma de las tablas.
// ============================================================================

// Formas mínimas de lo que Prisma devuelve con los `include` usados en
// PrismaPlanRepository. Se declaran a mano (no importadas de @prisma/client)
// porque el cliente generado en este entorno es un stub sin tipos por modelo
// (ver nota en PrismaService.ts); esto deberá ajustarse tras `prisma generate`
// real si los nombres de include difieren.
export interface PrismaWorkoutExerciseRow {
  id: string;
  exerciseId: string;
  orden: number;
  series: number;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
  rirObjetivo: number;
  esSuperset: boolean;
  grupoSupersetId: string | null;
  sustituidoDesde: string | null;
  motivoSustitucion: string | null;
  exercise: { nombre: string; grupoPrimario: string };
}

export interface PrismaWorkoutDayRow {
  id: string;
  orden: number;
  nombre: string;
  gruposMusculares: unknown; // JSON column
  cardioModalidad: string | null;
  cardioDuracionMin: number | null;
  cardioIntensidad: string | null;
  cardioMotivo: string | null;
  ejercicios: PrismaWorkoutExerciseRow[];
}

export interface PrismaWorkoutPlanRow {
  id: string;
  userId: string;
  version: number;
  activo: boolean;
  nivelPrograma: string;
  nivelSolicitado: string | null;
  warningsJson: unknown;
  traceJson: unknown;
  createdAt: Date;
  dias: PrismaWorkoutDayRow[];
}

export function planRowToResult(row: PrismaWorkoutPlanRow): WorkoutPlanResult {
  const dias: WorkoutDayPlan[] = row.dias
    .sort((a, b) => a.orden - b.orden)
    .map((dia) => ({
      id: dia.id,
      orden: dia.orden,
      nombre: dia.nombre,
      gruposMusculares: dia.gruposMusculares as WorkoutDayPlan['gruposMusculares'],
      ejercicios: dia.ejercicios
        .sort((a, b) => a.orden - b.orden)
        .map((ej): WorkoutExercisePlan => ({
          exerciseId: ej.exerciseId,
          nombre: ej.exercise.nombre,
          grupoPrimario: ej.exercise.grupoPrimario as WorkoutExercisePlan['grupoPrimario'],
          series: ej.series,
          repsMin: ej.repsMin,
          repsMax: ej.repsMax,
          descansoSeg: ej.descansoSeg,
          rirObjetivo: ej.rirObjetivo,
          esSuperset: ej.esSuperset,
          grupoSupersetId: ej.grupoSupersetId,
          sustituidoDesde: ej.sustituidoDesde,
          motivoSustitucion: ej.motivoSustitucion,
        })),
      cardio: dia.cardioModalidad
        ? {
            modalidad: dia.cardioModalidad,
            duracionMin: dia.cardioDuracionMin ?? 0,
            intensidad: (dia.cardioIntensidad ?? 'moderada') as 'baja' | 'moderada' | 'alta' | 'intervalos',
            motivo: dia.cardioMotivo ?? '',
          }
        : null,
    }));

  return {
    nivelPrograma: row.nivelPrograma as WorkoutPlanResult['nivelPrograma'],
    nivelSolicitado: (row.nivelSolicitado as WorkoutPlanResult['nivelPrograma'] | null) ?? null,
    dias,
    warnings: Array.isArray(row.warningsJson) ? (row.warningsJson as WorkoutPlanResult['warnings']) : [],
    trace: Array.isArray(row.traceJson) ? (row.traceJson as string[]) : [],
  };
}
