"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTimeline = estimateTimeline;
const DISCLAIMER = 'Estimación aproximada y orientativa: el resultado real puede variar según alimentación, sueño, ' +
    'recuperación, actividad diaria, adherencia, genética, nivel inicial, estrés y otros factores individuales. ' +
    'No es una garantía de resultado.';
function estimateTimeline(input) {
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
    const kgPorMesPorNivel = {
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
function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}
