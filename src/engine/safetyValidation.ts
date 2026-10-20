import {
  EngineWarning,
  GrupoMuscular,
  NivelPrograma,
  WorkoutDayPlan,
} from '../domain/types';

// Rangos de volumen semanal (series/semana) por grupo muscular y nivel.
// Basados en rangos habituales conservadores de la literatura de hipertrofia;
// son la RECOMENDACIÓN DEL SISTEMA, no un valor exacto validado clínicamente
// para cada individuo (sección 37).
const VOLUMEN_MAX_SEMANAL: Record<NivelPrograma, number> = {
  foundation: 12,
  growth: 18,
  advanced: 22,
  olympia: 26,
};

export interface SafetyValidationResult {
  dias: WorkoutDayPlan[];
  warnings: EngineWarning[];
  trace: string[];
}

/**
 * Valida el plan ya construido:
 *  1) Recorta volumen semanal por grupo muscular si excede el máximo del nivel.
 *  2) Verifica que no haya más de 2 días consecutivos entrenando el mismo
 *     grupo muscular primario como foco principal sin descanso entre medio.
 * No modifica ejercicios ya excluidos por limitaciones (eso ocurrió en el
 * paso de selección); aquí se actúa solo sobre volumen y distribución.
 */
export function validatePlanSafety(
  dias: WorkoutDayPlan[],
  nivelPrograma: NivelPrograma,
): SafetyValidationResult {
  const warnings: EngineWarning[] = [];
  const trace: string[] = [];
  const maxSemanal = VOLUMEN_MAX_SEMANAL[nivelPrograma];

  // 1) Volumen semanal por grupo muscular (contando series de ejercicios cuyo
  // grupo primario coincide; los secundarios no cuentan para el tope, ya que
  // reciben menor estímulo directo).
  const seriesPorGrupo = new Map<GrupoMuscular, number>();
  for (const dia of dias) {
    for (const ej of dia.ejercicios) {
      const actual = seriesPorGrupo.get(ej.grupoPrimario) ?? 0;
      seriesPorGrupo.set(ej.grupoPrimario, actual + ej.series);
    }
  }

  for (const [grupo, totalSeries] of seriesPorGrupo.entries()) {
    if (totalSeries > maxSemanal) {
      const exceso = totalSeries - maxSemanal;
      trace.push(
        `Volumen semanal de ${grupo} (${totalSeries} series) excede el máximo recomendado para nivel ` +
          `${nivelPrograma} (${maxSemanal}) → se recorta ${exceso} serie(s).`,
      );
      recortarSeries(dias, grupo, exceso);
      warnings.push({
        codigo: 'VOLUMEN_AJUSTADO',
        mensaje: `Se ajustó el volumen semanal de ${grupo} para mantenerlo dentro de un rango seguro para tu nivel.`,
      });
    }
  }

  // 2) Grupos musculares primarios en días consecutivos (orden 1,2,3...).
  const ordenados = [...dias].sort((a, b) => a.orden - b.orden);
  for (let i = 0; i < ordenados.length - 1; i++) {
    const actual = new Set(ordenados[i].gruposMusculares);
    const siguiente = new Set(ordenados[i + 1].gruposMusculares);
    const interseccion = [...actual].filter((g) => siguiente.has(g) && g !== 'cardio' && g !== 'abdomen');
    if (interseccion.length > 0) {
      trace.push(
        `Días ${ordenados[i].orden} y ${ordenados[i + 1].orden} comparten grupo(s) muscular(es) ` +
          `${interseccion.join(', ')} en días consecutivos. Se registra como advertencia de recuperación ` +
          '(el volumen ya fue acotado por el tope semanal, por lo que el riesgo se considera controlado).',
      );
      warnings.push({
        codigo: 'GRUPOS_MUSCULARES_CONSECUTIVOS',
        mensaje:
          `Los días ${ordenados[i].orden} y ${ordenados[i + 1].orden} entrenan ${interseccion.join(', ')} ` +
          'en días seguidos. Esto es intencional cuando el volumen total está controlado, pero presta atención a tu recuperación.',
      });
    }
  }

  return { dias, warnings, trace };
}

function recortarSeries(dias: WorkoutDayPlan[], grupo: GrupoMuscular, exceso: number): void {
  let restante = exceso;
  for (const dia of dias) {
    if (restante <= 0) break;
    for (const ej of dia.ejercicios) {
      if (restante <= 0) break;
      if (ej.grupoPrimario === grupo && ej.series > 2) {
        // Nunca recortar por debajo de 2 series por ejercicio.
        const reduccion = Math.min(ej.series - 2, restante);
        ej.series -= reduccion;
        restante -= reduccion;
      }
    }
  }
}
