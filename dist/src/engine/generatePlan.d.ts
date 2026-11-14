import { EngineInput, Exercise, WorkoutPlanResult } from '../domain/types';
/**
 * Punto de entrada único del Rules Engine.
 * Pipeline (documento de diseño, sección 7):
 *   1. Selección de nivel de programa
 *   2. Selección de plantilla de división semanal
 *   3. Selección de ejercicios por día (con sustitución)
 *   4. Parámetros de series/reps/descanso
 *   5. Validación de seguridad
 */
export declare function generateWorkoutPlan(input: EngineInput, catalog?: Exercise[]): WorkoutPlanResult;
