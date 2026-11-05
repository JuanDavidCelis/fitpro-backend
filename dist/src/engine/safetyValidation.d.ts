import { EngineWarning, NivelPrograma, WorkoutDayPlan } from '../domain/types';
export interface SafetyValidationResult {
    dias: WorkoutDayPlan[];
    warnings: EngineWarning[];
    trace: string[];
}
/**
 * Valida el plan ya construido:
 *  1) Recorta volumen semanal por grupo muscular si excede el máximo del nivel.
 *  2) Verifica que no haya más de 2 días consecutivos entrenando el mismo
 *     grupo muscular primario como foco principal sin descanso entre medio.
 * No modifica ejercicios ya excluidos por limitaciones (eso ocurrió en el
 * paso de selección); aquí se actúa solo sobre volumen y distribución.
 */
export declare function validatePlanSafety(dias: WorkoutDayPlan[], nivelPrograma: NivelPrograma): SafetyValidationResult;
