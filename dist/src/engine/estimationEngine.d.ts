import { NivelExperiencia, ObjetivoTipo } from '../domain/types';
export interface EstimationInput {
    objetivo: ObjetivoTipo;
    nivelExperiencia: NivelExperiencia;
    pesoInicialKg: number;
    metaValor: number;
    adherenciaEsperada: number;
}
export interface EstimationResult {
    semanasMinimo: number;
    semanasMaximo: number;
    disclaimer: string;
}
export declare function estimateTimeline(input: EstimationInput): EstimationResult;
