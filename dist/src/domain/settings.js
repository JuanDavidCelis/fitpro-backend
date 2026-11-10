"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_MUSCULOS_PRIORITARIOS = exports.MUSCULOS_PRIORIZABLES = exports.EQUIPAMIENTOS = exports.SEXOS = exports.OBJETIVOS = exports.NIVELES = void 0;
exports.validateUserSettings = validateUserSettings;
exports.trainingFieldsChanged = trainingFieldsChanged;
const health_1 = require("./health");
exports.NIVELES = ['principiante', 'intermedio', 'avanzado'];
exports.OBJETIVOS = ['perdida_grasa', 'hipertrofia'];
exports.SEXOS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'];
exports.EQUIPAMIENTOS = [
    'mancuernas', 'barra', 'discos', 'rack', 'poleas', 'banco', 'maquinas', 'smith', 'prensa',
    'bicicleta', 'caminadora', 'eliptica', 'remo_ergometro', 'peso_corporal',
    'maquina_hack', 'maquina_extension_cuadriceps', 'cajon', 'agarre_neutro', 'maquina_pec_deck',
    'maquina', 'banco_inclinado', 'barra_recta', 'soporte_t', 'maquina_dominadas_asistidas',
    'cuerda', 'agarre_individual', 'barra_v', 'mancuerna', 'maquina_curl_femoral_sentado',
    'maquina_curl_femoral_acostado', 'maquina_extension_cadera', 'maquina_abduccion_cadera',
    'tobillera', 'maquina_adductores', 'maquina_aductores', 'rueda_abdominal', 'barra_dominadas',
    'maquina_pantorrilla_sentado', 'escalon', 'banco_declinado', 'maquina_press_convergente',
    'barra_ez', 'banco_predicador', 'kettlebell', 'trap_bar', 'trineo', 'cuerda_saltar',
    'maquina_escaladora', 'piscina', 'prensa_horizontal', 'banco_extension_lumbar',
    'maquina_pendulo', 'agarre',
];
exports.MUSCULOS_PRIORIZABLES = [
    'pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'antebrazo', 'abdomen',
    'oblicuos', 'gluteos', 'cuadriceps', 'femoral', 'pantorrilla', 'trapecio', 'aductores',
];
exports.MAX_MUSCULOS_PRIORITARIOS = 2;
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
function lista(v, permitidos, campo, errores, max = 20) {
    if (v === undefined || v === null)
        return [];
    if (!Array.isArray(v) || v.length > max) {
        errores.push(`${campo} debe ser una lista de hasta ${max} elementos`);
        return [];
    }
    const fuera = v.filter((x) => typeof x !== 'string' || !permitidos.includes(x));
    if (fuera.length)
        errores.push(`${campo} tiene valores no válidos`);
    return [...new Set(v.filter((x) => typeof x === 'string' && permitidos.includes(x)))];
}
/** Valida y normaliza lo que manda el cliente. Nunca se confía en el cuerpo sin revisar. */
function validateUserSettings(body) {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { ok: false, errores: ['El cuerpo de la petición debe ser un objeto'] };
    }
    const b = body;
    const errores = [];
    const edad = num(b.edad);
    if (edad === null || !Number.isInteger(edad) || edad < 14 || edad > 90)
        errores.push('edad debe ser un entero entre 14 y 90');
    const pesoKg = num(b.pesoKg);
    if (pesoKg === null || pesoKg < 20 || pesoKg > 400)
        errores.push('pesoKg debe estar entre 20 y 400');
    const alturaCm = num(b.alturaCm);
    if (alturaCm === null || alturaCm < 80 || alturaCm > 260)
        errores.push('alturaCm debe estar entre 80 y 260');
    if (typeof b.sexo !== 'string' || !exports.SEXOS.includes(b.sexo))
        errores.push('sexo no es válido');
    if (typeof b.nivelExperiencia !== 'string' || !exports.NIVELES.includes(b.nivelExperiencia))
        errores.push('nivelExperiencia no es válido');
    if (typeof b.objetivo !== 'string' || !exports.OBJETIVOS.includes(b.objetivo))
        errores.push('objetivo no es válido');
    const dias = num(b.diasPorSemana);
    if (dias === null || !Number.isInteger(dias) || dias < 2 || dias > 6)
        errores.push('diasPorSemana debe ser un entero entre 2 y 6');
    const minutos = num(b.minutosPorSesion);
    if (minutos === null || !Number.isInteger(minutos) || minutos < 15 || minutos > 180)
        errores.push('minutosPorSesion debe ser un entero entre 15 y 180');
    let pesoObjetivoKg = null;
    if (b.pesoObjetivoKg !== undefined && b.pesoObjetivoKg !== null) {
        const o = num(b.pesoObjetivoKg);
        if (o === null || o < 20 || o > 400)
            errores.push('pesoObjetivoKg debe estar entre 20 y 400');
        else
            pesoObjetivoKg = Math.round(o * 10) / 10;
    }
    const equipamiento = lista(b.equipamiento, exports.EQUIPAMIENTOS, 'equipamiento', errores);
    const lesiones = lista(b.lesiones, health_1.AREAS_CORPORALES, 'lesiones', errores);
    const dolorActual = lista(b.dolorActual, health_1.AREAS_CORPORALES, 'dolorActual', errores);
    const musculosPrioritarios = lista(b.musculosPrioritarios, exports.MUSCULOS_PRIORIZABLES, 'musculosPrioritarios', errores);
    if (musculosPrioritarios.length > exports.MAX_MUSCULOS_PRIORITARIOS) {
        errores.push(`Elige como máximo ${exports.MAX_MUSCULOS_PRIORITARIOS} músculos prioritarios`);
    }
    if (b.condicionMedica !== undefined && typeof b.condicionMedica !== 'boolean')
        errores.push('condicionMedica debe ser verdadero o falso');
    if (errores.length > 0)
        return { ok: false, errores };
    return {
        ok: true,
        value: {
            edad: edad,
            sexo: b.sexo,
            pesoKg: Math.round(pesoKg * 10) / 10,
            alturaCm: alturaCm,
            nivelExperiencia: b.nivelExperiencia,
            objetivo: b.objetivo,
            diasPorSemana: dias,
            minutosPorSesion: minutos,
            equipamiento,
            pesoObjetivoKg,
            lesiones,
            dolorActual,
            condicionMedica: b.condicionMedica === true,
            musculosPrioritarios,
        },
    };
}
const mismos = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);
/**
 * ¿Cambió algo que altera la rutina? Peso, altura, edad y peso objetivo NO
 * obligan a regenerar; nivel, objetivo, días, minutos, equipo, salud y
 * músculos prioritarios SÍ.
 */
function trainingFieldsChanged(a, b) {
    return (a.nivelExperiencia !== b.nivelExperiencia ||
        a.objetivo !== b.objetivo ||
        a.diasPorSemana !== b.diasPorSemana ||
        a.minutosPorSesion !== b.minutosPorSesion ||
        a.condicionMedica !== b.condicionMedica ||
        !mismos(a.equipamiento, b.equipamiento) ||
        !mismos(a.lesiones, b.lesiones) ||
        !mismos(a.dolorActual, b.dolorActual) ||
        !mismos(a.musculosPrioritarios, b.musculosPrioritarios));
}
