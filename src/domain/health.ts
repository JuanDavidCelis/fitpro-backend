import { EXERCISES } from '../data/exercises';
import { AreaCorporal, Limitaciones, PatronMovimiento } from './types';

export const AREAS_CORPORALES: readonly AreaCorporal[] = [
  'hombro', 'codo', 'muneca', 'espalda_baja', 'cadera', 'rodilla', 'tobillo',
];

// Qué patrones de movimiento se omiten cuando el usuario declara molestias en
// una zona. Es una medida CONSERVADORA de seguridad, no un diagnóstico: el
// usuario puede quitar la zona cuando se recupere y el plan se regenera.
const PATRONES_A_EVITAR: Record<AreaCorporal, PatronMovimiento[]> = {
  hombro: ['push'],
  codo: [],
  muneca: [],
  espalda_baja: ['hinge'],
  cadera: ['squat', 'hinge'],
  rodilla: ['squat'],
  tobillo: [],
};

// Zonas para las que se evita el cardio de alto impacto (carrera, saltos).
const EVITAN_ALTO_IMPACTO: readonly AreaCorporal[] = ['rodilla', 'cadera', 'tobillo', 'espalda_baja'];

/**
 * Traduce lo que el usuario declara (zonas con lesión/dolor y condición
 * médica) a las restricciones que entiende el motor de reglas.
 */
export function construirLimitaciones(
  lesiones: readonly AreaCorporal[],
  dolorActual: readonly AreaCorporal[],
  condicionMedica: boolean,
): Limitaciones {
  const areas = new Set<AreaCorporal>([...lesiones, ...dolorActual]);
  const patrones = new Set<PatronMovimiento>();
  for (const a of areas) PATRONES_A_EVITAR[a].forEach((p) => patrones.add(p));

  // Muñeca/codo: se omiten el trabajo de antebrazo y los acarreos de agarre.
  const excluidos = new Set<string>();
  if (areas.has('muneca') || areas.has('codo')) {
    for (const ex of EXERCISES) {
      if (ex.etiquetas.includes('antebrazo') || ex.patron === 'carry') excluidos.add(ex.id);
    }
  }

  return {
    lesiones: [...lesiones],
    dolorActual: [...dolorActual],
    patronesExcluidos: [...patrones],
    ejerciciosExcluidosIds: [...excluidos],
    requiereConsultaProfesional: condicionMedica || dolorActual.length > 0,
  };
}

export function evitaAltoImpacto(l: Limitaciones): boolean {
  return [...l.lesiones, ...l.dolorActual].some((a) => EVITAN_ALTO_IMPACTO.includes(a as AreaCorporal));
}
