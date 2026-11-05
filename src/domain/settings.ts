import {
  AreaCorporal, Equipamiento, GrupoMuscular, NivelExperiencia, ObjetivoTipo, UserSettings,
} from './types';
import { AREAS_CORPORALES } from './health';

export const NIVELES: readonly NivelExperiencia[] = ['principiante', 'intermedio', 'avanzado'];
export const OBJETIVOS: readonly ObjetivoTipo[] = ['perdida_grasa', 'hipertrofia'];
export const SEXOS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] as const;
export const EQUIPAMIENTOS: readonly Equipamiento[] = [
  'mancuernas', 'barra', 'discos', 'rack', 'poleas', 'banco', 'maquinas', 'smith', 'prensa',
  'bicicleta', 'caminadora', 'eliptica', 'remo_ergometro', 'peso_corporal',
];
export const MUSCULOS_PRIORIZABLES: readonly GrupoMuscular[] = [
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'antebrazo', 'abdomen',
  'gluteos', 'cuadriceps', 'femoral', 'pantorrilla',
];
export const MAX_MUSCULOS_PRIORITARIOS = 2;

export type SettingsValidation = { ok: true; value: UserSettings } | { ok: false; errores: string[] };

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function lista<T extends string>(
  v: unknown, permitidos: readonly T[], campo: string, errores: string[], max = 20,
): T[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > max) {
    errores.push(`${campo} debe ser una lista de hasta ${max} elementos`);
    return [];
  }
  const fuera = v.filter((x) => typeof x !== 'string' || !permitidos.includes(x as T));
  if (fuera.length) errores.push(`${campo} tiene valores no válidos`);
  return [...new Set(v.filter((x): x is T => typeof x === 'string' && permitidos.includes(x as T)))];
}

/** Valida y normaliza lo que manda el cliente. Nunca se confía en el cuerpo sin revisar. */
export function validateUserSettings(body: unknown): SettingsValidation {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errores: ['El cuerpo de la petición debe ser un objeto'] };
  }
  const b = body as Record<string, unknown>;
  const errores: string[] = [];

  const edad = num(b.edad);
  if (edad === null || !Number.isInteger(edad) || edad < 14 || edad > 90) errores.push('edad debe ser un entero entre 14 y 90');
  const pesoKg = num(b.pesoKg);
  if (pesoKg === null || pesoKg < 20 || pesoKg > 400) errores.push('pesoKg debe estar entre 20 y 400');
  const alturaCm = num(b.alturaCm);
  if (alturaCm === null || alturaCm < 80 || alturaCm > 260) errores.push('alturaCm debe estar entre 80 y 260');
  if (typeof b.sexo !== 'string' || !(SEXOS as readonly string[]).includes(b.sexo)) errores.push('sexo no es válido');
  if (typeof b.nivelExperiencia !== 'string' || !(NIVELES as readonly string[]).includes(b.nivelExperiencia)) errores.push('nivelExperiencia no es válido');
  if (typeof b.objetivo !== 'string' || !(OBJETIVOS as readonly string[]).includes(b.objetivo)) errores.push('objetivo no es válido');
  const dias = num(b.diasPorSemana);
  if (dias === null || !Number.isInteger(dias) || dias < 2 || dias > 6) errores.push('diasPorSemana debe ser un entero entre 2 y 6');
  const minutos = num(b.minutosPorSesion);
  if (minutos === null || !Number.isInteger(minutos) || minutos < 15 || minutos > 180) errores.push('minutosPorSesion debe ser un entero entre 15 y 180');

  let pesoObjetivoKg: number | null = null;
  if (b.pesoObjetivoKg !== undefined && b.pesoObjetivoKg !== null) {
    const o = num(b.pesoObjetivoKg);
    if (o === null || o < 20 || o > 400) errores.push('pesoObjetivoKg debe estar entre 20 y 400');
    else pesoObjetivoKg = Math.round(o * 10) / 10;
  }

  const equipamiento = lista<Equipamiento>(b.equipamiento, EQUIPAMIENTOS, 'equipamiento', errores);
  const lesiones = lista<AreaCorporal>(b.lesiones, AREAS_CORPORALES, 'lesiones', errores);
  const dolorActual = lista<AreaCorporal>(b.dolorActual, AREAS_CORPORALES, 'dolorActual', errores);
  const musculosPrioritarios = lista<GrupoMuscular>(b.musculosPrioritarios, MUSCULOS_PRIORIZABLES, 'musculosPrioritarios', errores);
  if (musculosPrioritarios.length > MAX_MUSCULOS_PRIORITARIOS) {
    errores.push(`Elige como máximo ${MAX_MUSCULOS_PRIORITARIOS} músculos prioritarios`);
  }
  if (b.condicionMedica !== undefined && typeof b.condicionMedica !== 'boolean') errores.push('condicionMedica debe ser verdadero o falso');

  if (errores.length > 0) return { ok: false, errores };

  return {
    ok: true,
    value: {
      edad: edad as number,
      sexo: b.sexo as UserSettings['sexo'],
      pesoKg: Math.round((pesoKg as number) * 10) / 10,
      alturaCm: alturaCm as number,
      nivelExperiencia: b.nivelExperiencia as NivelExperiencia,
      objetivo: b.objetivo as ObjetivoTipo,
      diasPorSemana: dias as number,
      minutosPorSesion: minutos as number,
      equipamiento,
      pesoObjetivoKg,
      lesiones,
      dolorActual,
      condicionMedica: b.condicionMedica === true,
      musculosPrioritarios,
    },
  };
}

const mismos = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

/**
 * ¿Cambió algo que altera la rutina? Peso, altura, edad y peso objetivo NO
 * obligan a regenerar; nivel, objetivo, días, minutos, equipo, salud y
 * músculos prioritarios SÍ.
 */
export function trainingFieldsChanged(a: UserSettings, b: UserSettings): boolean {
  return (
    a.nivelExperiencia !== b.nivelExperiencia ||
    a.objetivo !== b.objetivo ||
    a.diasPorSemana !== b.diasPorSemana ||
    a.minutosPorSesion !== b.minutosPorSesion ||
    a.condicionMedica !== b.condicionMedica ||
    !mismos(a.equipamiento, b.equipamiento) ||
    !mismos(a.lesiones, b.lesiones) ||
    !mismos(a.dolorActual, b.dolorActual) ||
    !mismos(a.musculosPrioritarios, b.musculosPrioritarios)
  );
}
