import { EngineInput, GrupoMuscular } from '../domain/types';
export interface DayTemplate {
    orden: number;
    nombre: string;
    gruposMusculares: GrupoMuscular[];
    incluyeCardio: boolean;
}
export interface SplitResult {
    dias: DayTemplate[];
    trace: string[];
}
/**
 * Selecciona una plantilla de división semanal según objetivo, días
 * disponibles, nivel y minutos por sesión. NO es una tabla única fija:
 * se construye combinando reglas, tal como exige el documento de diseño
 * (sección 6): "el motor NO debe limitarse a utilizar esta distribución
 * siempre".
 */
export declare function selectSplit(input: EngineInput): SplitResult;
