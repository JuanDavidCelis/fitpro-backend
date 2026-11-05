import { Exercise, EngineInput, GrupoMuscular, NivelPrograma } from '../domain/types';
export interface SelectedExercise {
    exercise: Exercise;
    sustituidoDesde: string | null;
    motivoSustitucion: string | null;
}
/**
 * Determina si un ejercicio es elegible dado el equipamiento disponible,
 * el nivel de programa y las limitaciones del usuario.
 */
export declare function isEligible(exercise: Exercise, equipamientoDisponible: Set<string>, nivelPrograma: NivelPrograma, limitaciones: EngineInput['limitaciones']): boolean;
/**
 * Intenta resolver un ejercicio "ideal" contra las restricciones reales del
 * usuario. Si no es elegible directamente, recorre su cadena de alternativas
 * (sección 21: mantener patrón de movimiento y grupo muscular en lo posible).
 * Devuelve null si ninguna alternativa es viable (se descarta ese slot).
 */
export declare function resolveExercise(idealExerciseId: string, input: EngineInput, nivelPrograma: NivelPrograma, yaUsados: Set<string>): SelectedExercise | null;
/**
 * Selecciona todos los ejercicios elegibles para un grupo muscular dado,
 * ordenados sin repetir, respetando equipamiento/nivel/limitaciones.
 */
export declare function candidatesForGroup(grupo: GrupoMuscular, input: EngineInput, nivelPrograma: NivelPrograma): Exercise[];
