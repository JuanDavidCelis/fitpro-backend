import { NivelExperiencia, ObjetivoTipo } from '../domain/types';

// ============================================================================
// Estimation Engine (sección 11). Calcula un RANGO orientativo, nunca una
// fecha exacta ni una promesa. Los factores no controlados por la app
// (alimentación, sueño, genética, estrés, adherencia real) se comunican
// siempre junto al resultado.
// ============================================================================

export interface EstimationInput {
  objetivo: ObjetivoTipo;
  nivelExperiencia: NivelExperiencia;
  pesoInicialKg: number;
  metaValor: number; // kg a perder/ganar, o "cm de cintura", etc. (unidad definida por el Goal)
  adherenciaEsperada: number; // 0..1, si hay historial; si no, se asume 0.8 (optimista-conservador)
}

export interface EstimationResult {
  semanasMinimo: number;
  semanasMaximo: number;
  disclaimer: string;
}

const DISCLAIMER =
  'Estimación aproximada y orientativa: el resultado real puede variar según alimentación, sueño, ' +
  'recuperación, actividad diaria, adherencia, genética, nivel inicial, estrés y otros factores individuales. ' +
  'No es una garantía de resultado.';

export function estimateTimeline(input: EstimationInput): EstimationResult {
  const adherencia = clamp(input.adherenciaEsperada, 0.3, 1);

  if (input.objetivo === 'perdida_grasa') {
    // Rango conservador de referencia: 0.4% - 0.8% del peso corporal por
    // semana es un ritmo comúnmente considerado sostenible; se usa como base
    // de cálculo, no como cifra clínica exacta para cada persona.
    const kgPorSemanaMin = input.pesoInicialKg * 0.004 * adherencia;
    const kgPorSemanaMax = input.pesoInicialKg * 0.008 * adherencia;
    const semanasMinimo = Math.ceil(input.metaValor / kgPorSemanaMax);
    const semanasMaximo = Math.ceil(input.metaValor / kgPorSemanaMin);
    return { semanasMinimo, semanasMaximo, disclaimer: DISCLAIMER };
  }

  // Hipertrofia: tasas de ganancia de masa muscular varían mucho más según
  // nivel de experiencia (efecto de "ganancias de principiante"). Rango base
  // ilustrativo por nivel, ajustado por adherencia.
  const kgPorMesPorNivel: Record<NivelExperiencia, [number, number]> = {
    principiante: [0.5, 1.0],
    intermedio: [0.25, 0.5],
    avanzado: [0.1, 0.25],
  };
  const [minMes, maxMes] = kgPorMesPorNivel[input.nivelExperiencia];
  const mesesMinimo = input.metaValor / (maxMes * adherencia);
  const mesesMaximo = input.metaValor / (minMes * adherencia);

  return {
    semanasMinimo: Math.ceil(mesesMinimo * 4.345),
    semanasMaximo: Math.ceil(mesesMaximo * 4.345),
    disclaimer: DISCLAIMER,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
