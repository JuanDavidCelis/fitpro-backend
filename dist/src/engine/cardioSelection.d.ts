import { CardioBlockPlan, EngineInput } from '../domain/types';
/**
 * Sub-reglas de cardio (sección 7.1 del documento de diseño). No existe un
 * "mejor" cardio universal: la elección depende de nivel, peso, tiempo,
 * equipamiento, preferencias y recuperación reciente.
 */
export declare function selectCardio(input: EngineInput, nivelPrograma: 'foundation' | 'growth' | 'advanced' | 'olympia', minutosDisponibles: number): CardioBlockPlan | null;
