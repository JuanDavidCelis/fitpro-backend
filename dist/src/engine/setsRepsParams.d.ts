import { NivelPrograma, ObjetivoTipo, PatronMovimiento } from '../domain/types';
export interface SetsRepsParams {
    series: number;
    repsMin: number;
    repsMax: number;
    descansoSeg: number;
    rirObjetivo: number;
}
/**
 * Determina series/reps/descanso/RIR según objetivo, nivel de programa y si
 * el ejercicio es compuesto (patrón push/pull/squat/hinge) o de aislamiento.
 * Los rangos son deliberadamente conservadores y basados en prácticas
 * ampliamente aceptadas de programación de fuerza/hipertrofia, no en un único
 * "número mágico". Ver sección 37: distinguir evidencia / práctica habitual /
 * recomendación del sistema — estos valores son la RECOMENDACIÓN DEL SISTEMA.
 */
export declare function computeSetsReps(objetivo: ObjetivoTipo, nivelPrograma: NivelPrograma, patron: PatronMovimiento, esEjercicioPrincipalDelDia: boolean): SetsRepsParams;
