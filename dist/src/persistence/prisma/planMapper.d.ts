import { WorkoutPlanResult } from '../../domain/types';
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
    exercise: {
        nombre: string;
        grupoPrimario: string;
        instrucciones?: string | null;
        erroresComunes?: unknown;
        alternativas?: unknown;
    };
}
export interface PrismaWorkoutDayRow {
    id: string;
    orden: number;
    nombre: string;
    gruposMusculares: unknown;
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
export declare function planRowToResult(row: PrismaWorkoutPlanRow): WorkoutPlanResult;
