import { Equipamiento, GrupoMuscular, NivelExperiencia, ObjetivoTipo, UserSettings } from './types';
export declare const NIVELES: readonly NivelExperiencia[];
export declare const OBJETIVOS: readonly ObjetivoTipo[];
export declare const SEXOS: readonly ["masculino", "femenino", "otro", "prefiero_no_decir"];
export declare const EQUIPAMIENTOS: readonly Equipamiento[];
export declare const MUSCULOS_PRIORIZABLES: readonly GrupoMuscular[];
export declare const MAX_MUSCULOS_PRIORITARIOS = 2;
export type SettingsValidation = {
    ok: true;
    value: UserSettings;
} | {
    ok: false;
    errores: string[];
};
/** Valida y normaliza lo que manda el cliente. Nunca se confía en el cuerpo sin revisar. */
export declare function validateUserSettings(body: unknown): SettingsValidation;
/**
 * ¿Cambió algo que altera la rutina? Peso, altura, edad y peso objetivo NO
 * obligan a regenerar; nivel, objetivo, días, minutos, equipo, salud y
 * músculos prioritarios SÍ.
 */
export declare function trainingFieldsChanged(a: UserSettings, b: UserSettings): boolean;
