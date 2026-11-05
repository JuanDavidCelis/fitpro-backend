export interface SetLog {
    pesoKg: number;
    repsRealizadas: number;
    rirReportado: number;
}
export interface SessionLog {
    fecha: string;
    sets: SetLog[];
    repsObjetivoMax: number;
}
export type AdaptationAction = {
    tipo: 'incrementar_carga';
    porcentaje: number;
    motivo: string;
} | {
    tipo: 'incrementar_repeticion_objetivo';
    motivo: string;
} | {
    tipo: 'mantener';
    motivo: string;
} | {
    tipo: 'reducir_volumen_temporalmente';
    porcentaje: number;
    motivo: string;
};
/**
 * Recibe el historial reciente (más nuevo al final) de un ejercicio concreto
 * y decide la acción de adaptación. Es determinista: mismas entradas, misma
 * salida. La IA (si se usa) solo puede explicar esta decisión, no cambiarla.
 */
export declare function decideAdaptation(historialReciente: SessionLog[], recoveryScorePromedioReciente: number): AdaptationAction;
