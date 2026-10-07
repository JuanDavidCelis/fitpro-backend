import { NivelPrograma, ObjetivoTipo, PatronMovimiento } from '../domain/types';

export interface SetsRepsParams {
  series: number;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
  rirObjetivo: number;
}

/**
 * Determina series/reps/descanso/RIR según objetivo, nivel de programa y si
 * el ejercicio es compuesto (patrón push/pull/squat/hinge) o de aislamiento.
 * Los rangos son deliberadamente conservadores y basados en prácticas
 * ampliamente aceptadas de programación de fuerza/hipertrofia, no en un único
 * "número mágico". Ver sección 37: distinguir evidencia / práctica habitual /
 * recomendación del sistema — estos valores son la RECOMENDACIÓN DEL SISTEMA.
 */
export function computeSetsReps(
  objetivo: ObjetivoTipo,
  nivelPrograma: NivelPrograma,
  patron: PatronMovimiento,
  esEjercicioPrincipalDelDia: boolean,
): SetsRepsParams {
  const esCompuesto = ['push', 'pull', 'squat', 'hinge'].includes(patron);

  if (objetivo === 'perdida_grasa') {
    return {
      series: 3,
      repsMin: 10,
      repsMax: 15,
      descansoSeg: esCompuesto ? 75 : 45,
      rirObjetivo: 2,
    };
  }

  // Hipertrofia
  const seriesBase = nivelPrograma === 'foundation' ? 3 : nivelPrograma === 'growth' ? 3 : 4;
  const seriesPrincipal = esEjercicioPrincipalDelDia ? seriesBase + 1 : seriesBase;

  if (esCompuesto) {
    return {
      series: Math.min(seriesPrincipal, 5),
      repsMin: 6,
      repsMax: 12,
      descansoSeg: nivelPrograma === 'foundation' ? 90 : 120,
      rirObjetivo: nivelPrograma === 'olympia' ? 1 : 2,
    };
  }

  return {
    series: seriesBase,
    repsMin: 10,
    repsMax: 15,
    descansoSeg: 60,
    rirObjetivo: nivelPrograma === 'olympia' ? 1 : 2,
  };
}
