import { AreaCorporal, Limitaciones } from './types';
export declare const AREAS_CORPORALES: readonly AreaCorporal[];
/**
 * Traduce lo que el usuario declara (zonas con lesión/dolor y condición
 * médica) a las restricciones que entiende el motor de reglas.
 */
export declare function construirLimitaciones(lesiones: readonly AreaCorporal[], dolorActual: readonly AreaCorporal[], condicionMedica: boolean): Limitaciones;
export declare function evitaAltoImpacto(l: Limitaciones): boolean;
