"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkoutPlan = generateWorkoutPlan;
const levelSelection_1 = require("./levelSelection");
const splitSelection_1 = require("./splitSelection");
const exerciseSelection_1 = require("./exerciseSelection");
const exercises_1 = require("../data/exercises");
const setsRepsParams_1 = require("./setsRepsParams");
const cardioSelection_1 = require("./cardioSelection");
const safetyValidation_1 = require("./safetyValidation");
/**
 * Punto de entrada único del Rules Engine.
 * Pipeline (documento de diseño, sección 7):
 *   1. Selección de nivel de programa
 *   2. Selección de plantilla de división semanal
 *   3. Selección de ejercicios por día (con sustitución)
 *   4. Parámetros de series/reps/descanso
 *   5. Validación de seguridad
 */
function generateWorkoutPlan(input, catalog = exercises_1.EXERCISES) {
    const trace = [];
    const warnings = [];
    // Paso 1
    const nivelResult = (0, levelSelection_1.selectProgramLevel)(input);
    trace.push(...nivelResult.trace);
    warnings.push(...nivelResult.warnings);
    const nivelPrograma = nivelResult.nivelPrograma;
    // Seguridad (sección 10/38 del diseño): la app no diagnostica ni reemplaza a un profesional.
    const lim = input.limitaciones;
    if (lim.requiereConsultaProfesional) {
        warnings.push({
            codigo: 'CONSULTA_PROFESIONAL',
            mensaje: 'Indicaste dolor actual o una condición médica. Esta app no diagnostica ni reemplaza a un profesional: ' +
                'consulta a un médico o fisioterapeuta antes de entrenar y detén cualquier ejercicio que te cause dolor.',
        });
    }
    const zonas = [...new Set([...lim.lesiones, ...lim.dolorActual])];
    if (zonas.length > 0) {
        warnings.push({
            codigo: 'EJERCICIOS_OMITIDOS',
            mensaje: `Omitimos ejercicios que cargan las zonas donde indicaste molestias (${zonas.join(', ').replace(/_/g, ' ')}).`,
        });
        trace.push(`Zonas declaradas: ${zonas.join(', ')} → patrones excluidos: ${lim.patronesExcluidos.join(', ') || 'ninguno'}.`);
    }
    // Paso 2
    const splitResult = (0, splitSelection_1.selectSplit)(input);
    trace.push(...splitResult.trace);
    // Paso 3 + 4: construir cada día. La reutilización de un mismo ejercicio en
    // días distintos de la semana es normal (y necesaria cuando el catálogo
    // disponible es reducido, p. ej. sin equipamiento); lo que se evita es
    // repetir un ejercicio DENTRO del mismo día.
    const dias = splitResult.dias.map((template) => buildDay(template, input, nivelPrograma, trace, catalog));
    // Aplicar músculos prioritarios (sección 8): +1 ejercicio extra si el grupo
    // prioritario aparece en el split. Aquí sí se busca variedad frente a lo ya
    // usado en ESE día concreto.
    applyPriorityMuscles(dias, input, nivelPrograma, trace, catalog);
    // Paso 5
    const validation = (0, safetyValidation_1.validatePlanSafety)(dias, nivelPrograma);
    trace.push(...validation.trace);
    warnings.push(...validation.warnings);
    return {
        nivelPrograma,
        nivelSolicitado: nivelResult.nivelSolicitado,
        dias: validation.dias,
        warnings,
        trace,
    };
}
function buildDay(template, input, nivelPrograma, trace, catalog) {
    const ejercicios = [];
    const usadosEnDia = new Set();
    const gruposDelDia = template.gruposMusculares.filter((g) => g !== 'cardio');
    // Ejercicios por músculo del día. 1 principal (compuesto si existe) + 1
    // secundario cuando el grupo es un "foco" real del día (no solo secundario
    // por overlap). Se limita el total según minutos por sesión.
    const maxEjerciciosPorGrupo = gruposDelDia.length <= 2 ? 3 : 2;
    for (const grupo of gruposDelDia) {
        const candidatos = (0, exerciseSelection_1.candidatesForGroup)(grupo, input, nivelPrograma, catalog).filter((c) => !usadosEnDia.has(c.id));
        if (candidatos.length === 0) {
            trace.push(`Sin candidatos disponibles para ${grupo} en día "${template.nombre}" (equipamiento/nivel/limitaciones lo impiden).`);
            continue;
        }
        // Prioriza compuestos primero (mejor retorno de tiempo de entrenamiento).
        const ordenados = [...candidatos].sort((a, b) => {
            const aCompuesto = ['push', 'pull', 'squat', 'hinge'].includes(a.patron) ? 0 : 1;
            const bCompuesto = ['push', 'pull', 'squat', 'hinge'].includes(b.patron) ? 0 : 1;
            return aCompuesto - bCompuesto;
        });
        const seleccionParaGrupo = ordenados.slice(0, maxEjerciciosPorGrupo);
        seleccionParaGrupo.forEach((exercise, idx) => {
            usadosEnDia.add(exercise.id);
            const esPrincipal = idx === 0;
            const params = (0, setsRepsParams_1.computeSetsReps)(input.objetivo, nivelPrograma, exercise.patron, esPrincipal);
            ejercicios.push({
                exerciseId: exercise.id,
                nombre: exercise.nombre,
                grupoPrimario: exercise.grupoPrimario,
                series: params.series,
                repsMin: params.repsMin,
                repsMax: params.repsMax,
                descansoSeg: params.descansoSeg,
                rirObjetivo: params.rirObjetivo,
                esSuperset: false,
                grupoSupersetId: null,
                sustituidoDesde: null,
                motivoSustitucion: null,
                instrucciones: exercise.instrucciones,
                erroresComunes: exercise.erroresComunes,
                alternativas: exercise.alternativas,
            });
        });
    }
    // Antagonist supersets: si el día combina dos grupos claramente antagonistas
    // (ej. pecho+espalda, bíceps+tríceps) y el tiempo disponible es limitado,
    // se marcan pares como superset para ahorrar tiempo (sección 5).
    if (input.disponibilidad.minutosPorSesion < 60 && esParAntagonista(gruposDelDia)) {
        marcarSupersets(ejercicios, gruposDelDia, trace, template.nombre);
    }
    const cardio = template.incluyeCardio
        ? (0, cardioSelection_1.selectCardio)(input, nivelPrograma, Math.min(30, input.disponibilidad.minutosPorSesion))
        : null;
    return {
        id: null, // aún no persistido; se completa al leer un plan ya guardado
        orden: template.orden,
        nombre: template.nombre,
        gruposMusculares: template.gruposMusculares,
        ejercicios,
        cardio,
    };
}
const PARES_ANTAGONISTAS = [
    ['pecho', 'espalda'],
    ['biceps', 'triceps'],
    ['cuadriceps', 'femoral'],
];
function esParAntagonista(grupos) {
    return PARES_ANTAGONISTAS.some(([a, b]) => grupos.includes(a) && grupos.includes(b));
}
function marcarSupersets(ejercicios, grupos, trace, nombreDia) {
    const par = PARES_ANTAGONISTAS.find(([a, b]) => grupos.includes(a) && grupos.includes(b));
    if (!par)
        return;
    const [grupoA, grupoB] = par;
    const exA = ejercicios.find((e) => e.grupoPrimario === grupoA);
    const exB = ejercicios.find((e) => e.grupoPrimario === grupoB);
    if (exA && exB) {
        const grupoId = `ss_${exA.exerciseId}_${exB.exerciseId}`;
        exA.esSuperset = true;
        exA.grupoSupersetId = grupoId;
        exB.esSuperset = true;
        exB.grupoSupersetId = grupoId;
        trace.push(`Día "${nombreDia}": sesión < 60 min → se agrupan "${exA.nombre}" y "${exB.nombre}" ` +
            'como superset agonista-antagonista para optimizar el tiempo (estrategia de programación, sección 5).');
    }
}
function applyPriorityMuscles(dias, input, nivelPrograma, trace, catalog) {
    for (const grupoPrioritario of input.preferencias.musculosPrioritarios.slice(0, 2)) {
        const diaConGrupo = dias.find((d) => d.gruposMusculares.includes(grupoPrioritario));
        if (!diaConGrupo)
            continue;
        const idsYaEnEseDia = new Set(diaConGrupo.ejercicios.map((e) => e.exerciseId));
        const candidatos = (0, exerciseSelection_1.candidatesForGroup)(grupoPrioritario, input, nivelPrograma, catalog).filter((c) => !idsYaEnEseDia.has(c.id));
        if (candidatos.length === 0)
            continue;
        const extra = candidatos[0];
        const params = (0, setsRepsParams_1.computeSetsReps)(input.objetivo, nivelPrograma, extra.patron, false);
        diaConGrupo.ejercicios.push({
            exerciseId: extra.id,
            nombre: extra.nombre,
            grupoPrimario: extra.grupoPrimario,
            series: params.series,
            repsMin: params.repsMin,
            repsMax: params.repsMax,
            descansoSeg: params.descansoSeg,
            rirObjetivo: params.rirObjetivo,
            esSuperset: false,
            grupoSupersetId: null,
            sustituidoDesde: null,
            motivoSustitucion: null,
            instrucciones: extra.instrucciones,
            erroresComunes: extra.erroresComunes,
            alternativas: extra.alternativas,
        });
        trace.push(`"${grupoPrioritario}" marcado como músculo prioritario → se añade "${extra.nombre}" extra en día "${diaConGrupo.nombre}" ` +
            '(dentro de los límites de volumen semanal seguro, validados en el paso 5).');
    }
}
