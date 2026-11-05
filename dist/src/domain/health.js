"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AREAS_CORPORALES = void 0;
exports.construirLimitaciones = construirLimitaciones;
exports.evitaAltoImpacto = evitaAltoImpacto;
const exercises_1 = require("../data/exercises");
exports.AREAS_CORPORALES = [
    'hombro', 'codo', 'muneca', 'espalda_baja', 'cadera', 'rodilla', 'tobillo',
];
// Qué patrones de movimiento se omiten cuando el usuario declara molestias en
// una zona. Es una medida CONSERVADORA de seguridad, no un diagnóstico: el
// usuario puede quitar la zona cuando se recupere y el plan se regenera.
const PATRONES_A_EVITAR = {
    hombro: ['push'],
    codo: [],
    muneca: [],
    espalda_baja: ['hinge'],
    cadera: ['squat', 'hinge'],
    rodilla: ['squat'],
    tobillo: [],
};
// Zonas para las que se evita el cardio de alto impacto (carrera, saltos).
const EVITAN_ALTO_IMPACTO = ['rodilla', 'cadera', 'tobillo', 'espalda_baja'];
/**
 * Traduce lo que el usuario declara (zonas con lesión/dolor y condición
 * médica) a las restricciones que entiende el motor de reglas.
 */
function construirLimitaciones(lesiones, dolorActual, condicionMedica) {
    const areas = new Set([...lesiones, ...dolorActual]);
    const patrones = new Set();
    for (const a of areas)
        PATRONES_A_EVITAR[a].forEach((p) => patrones.add(p));
    // Muñeca/codo: se omiten el trabajo de antebrazo y los acarreos de agarre.
    const excluidos = new Set();
    if (areas.has('muneca') || areas.has('codo')) {
        for (const ex of exercises_1.EXERCISES) {
            if (ex.etiquetas.includes('antebrazo') || ex.patron === 'carry')
                excluidos.add(ex.id);
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
function evitaAltoImpacto(l) {
    return [...l.lesiones, ...l.dolorActual].some((a) => EVITAN_ALTO_IMPACTO.includes(a));
}
