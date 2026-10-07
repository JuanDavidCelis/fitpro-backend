// ============================================================================
// Adaptation Engine (sección 17 del documento de diseño).
// Analiza una serie de sesiones recientes de UN ejercicio concreto y decide
// si corresponde progresar la carga, mantenerla, o si hay señales de fatiga
// que ameriten un descarga. Nunca decide en base a una sola sesión.
// ============================================================================

export interface SetLog {
  pesoKg: number;
  repsRealizadas: number;
  rirReportado: number; // 0,1,2,3+
}

export interface SessionLog {
  fecha: string; // ISO date
  sets: SetLog[];
  repsObjetivoMax: number;
}

export type AdaptationAction =
  | { tipo: 'incrementar_carga'; porcentaje: number; motivo: string }
  | { tipo: 'incrementar_repeticion_objetivo'; motivo: string }
  | { tipo: 'mantener'; motivo: string }
  | { tipo: 'reducir_volumen_temporalmente'; porcentaje: number; motivo: string };

const MIN_SESIONES_PARA_DECISION = 2;
const SESIONES_PARA_DETECTAR_FATIGA = 3;

/**
 * Recibe el historial reciente (más nuevo al final) de un ejercicio concreto
 * y decide la acción de adaptación. Es determinista: mismas entradas, misma
 * salida. La IA (si se usa) solo puede explicar esta decisión, no cambiarla.
 */
export function decideAdaptation(
  historialReciente: SessionLog[],
  recoveryScorePromedioReciente: number,
): AdaptationAction {
  if (historialReciente.length < MIN_SESIONES_PARA_DECISION) {
    return {
      tipo: 'mantener',
      motivo: 'Aún no hay suficientes sesiones registradas para tomar una decisión de progresión.',
    };
  }

  const ultimas = historialReciente.slice(-SESIONES_PARA_DETECTAR_FATIGA);

  // --- Detección de fatiga sostenida (varias sesiones, no una) ---
  if (ultimas.length >= SESIONES_PARA_DETECTAR_FATIGA) {
    const rendimientoBajando = esTendenciaDecreciente(ultimas);
    if (rendimientoBajando && recoveryScorePromedioReciente < 55) {
      return {
        tipo: 'reducir_volumen_temporalmente',
        porcentaje: 30,
        motivo:
          `Rendimiento a la baja durante ${ultimas.length} sesiones consecutivas junto con un recovery ` +
          `score promedio de ${recoveryScorePromedioReciente}/100 → se sugiere una reducción temporal de ` +
          'volumen para favorecer la recuperación (no se actúa tras una sola sesión mala).',
      };
    }
  }

  // --- Progresión ---
  const ultimaSesion = historialReciente[historialReciente.length - 1];
  const penultimaSesion = historialReciente[historialReciente.length - 2];

  const enTopeDeRango = ultimaSesion.sets.every(
    (s) => s.repsRealizadas >= ultimaSesion.repsObjetivoMax,
  );
  const rirBajoConsistente = ultimaSesion.sets.every((s) => s.rirReportado <= 1);
  const rirAltoConsistente = ultimaSesion.sets.every((s) => s.rirReportado >= 3);

  const tambienEnTopeAnterior = penultimaSesion.sets.every(
    (s) => s.repsRealizadas >= penultimaSesion.repsObjetivoMax,
  );

  if (enTopeDeRango && tambienEnTopeAnterior && rirBajoConsistente) {
    return {
      tipo: 'incrementar_carga',
      porcentaje: 2.5,
      motivo:
        'Repeticiones en el tope del rango objetivo durante 2 sesiones seguidas con RIR bajo (buena ejecución) ' +
        '→ incremento conservador de carga (~2.5%).',
    };
  }

  if (enTopeDeRango && rirAltoConsistente) {
    return {
      tipo: 'incrementar_repeticion_objetivo',
      motivo:
        'Repeticiones en el tope del rango con margen de esfuerzo alto (RIR≥3) → se sugiere sumar una ' +
        'repetición objetivo antes de subir carga, para progresar de forma gradual.',
    };
  }

  return {
    tipo: 'mantener',
    motivo: 'El rendimiento reciente no muestra una señal clara de progresión ni de fatiga sostenida; se mantiene la prescripción actual.',
  };
}

function esTendenciaDecreciente(sesiones: SessionLog[]): boolean {
  const totalesVolumen = sesiones.map((s) =>
    s.sets.reduce((acc, set) => acc + set.pesoKg * set.repsRealizadas, 0),
  );
  let decrecio = 0;
  for (let i = 1; i < totalesVolumen.length; i++) {
    if (totalesVolumen[i] < totalesVolumen[i - 1]) decrecio++;
  }
  return decrecio >= totalesVolumen.length - 1;
}
