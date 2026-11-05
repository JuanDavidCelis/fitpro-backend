"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generatePlan_1 = require("../src/engine/generatePlan");
const levelSelection_1 = require("../src/engine/levelSelection");
const health_1 = require("../src/domain/health");
const settings_1 = require("../src/domain/settings");
const exercises_1 = require("../src/data/exercises");
const exerciseMedia_1 = require("../src/data/exerciseMedia");
const media_1 = require("../src/application/media");
const PlanApplicationService_1 = require("../src/application/PlanApplicationService");
const ProfileApplicationService_1 = require("../src/application/ProfileApplicationService");
const ProgressApplicationService_1 = require("../src/application/ProgressApplicationService");
const InMemoryPlanRepository_1 = require("../src/persistence/memory/InMemoryPlanRepository");
const InMemoryRecoveryRepository_1 = require("../src/persistence/memory/InMemoryRecoveryRepository");
const InMemoryProfileRepository_1 = require("../src/persistence/memory/InMemoryProfileRepository");
const InMemoryProgressRepository_1 = require("../src/persistence/memory/InMemoryProgressRepository");
const base = () => ({
    edad: 28, sexo: 'masculino', pesoKg: 80, alturaCm: 178, nivelExperiencia: 'principiante',
    objetivo: 'perdida_grasa', diasPorSemana: 5, minutosPorSesion: 45, equipamiento: ['mancuernas', 'banco'],
    pesoObjetivoKg: 72, lesiones: [], dolorActual: [], condicionMedica: false, musculosPrioritarios: [],
});
function setup() {
    const planRepo = new InMemoryPlanRepository_1.InMemoryPlanRepository();
    const profileRepo = new InMemoryProfileRepository_1.InMemoryProfileRepository();
    const progressRepo = new InMemoryProgressRepository_1.InMemoryProgressRepository();
    const planService = new PlanApplicationService_1.PlanApplicationService(planRepo, new InMemoryRecoveryRepository_1.InMemoryRecoveryRepository());
    return {
        planService,
        profile: new ProfileApplicationService_1.ProfileApplicationService(profileRepo, planService),
        progress: new ProgressApplicationService_1.ProgressApplicationService(progressRepo, profileRepo),
    };
}
describe('Validación de ajustes (se guarda todo el perfil)', () => {
    it('acepta un perfil completo', () => {
        expect((0, settings_1.validateUserSettings)(base()).ok).toBe(true);
    });
    it('los campos de salud son opcionales (clientes antiguos)', () => {
        const { lesiones, dolorActual, condicionMedica, musculosPrioritarios, ...viejo } = base();
        const r = (0, settings_1.validateUserSettings)(viejo);
        expect(r.ok).toBe(true);
        if (r.ok)
            expect(r.value.lesiones).toEqual([]);
    });
    it.each([
        ['edad fuera de rango', { edad: 5 }],
        ['peso absurdo', { pesoKg: 900 }],
        ['nivel inventado', { nivelExperiencia: 'olympia' }],
        ['objetivo inventado', { objetivo: 'volverse_gigante' }],
        ['días fuera de rango', { diasPorSemana: 9 }],
        ['equipo inexistente', { equipamiento: ['laser'] }],
        ['zona corporal inexistente', { lesiones: ['cerebro'] }],
        ['3 músculos prioritarios', { musculosPrioritarios: ['pecho', 'espalda', 'hombros'] }],
        ['peso objetivo absurdo', { pesoObjetivoKg: 5 }],
        ['condicionMedica no booleana', { condicionMedica: 'si' }],
    ])('rechaza: %s', (_n, cambio) => {
        expect((0, settings_1.validateUserSettings)({ ...base(), ...cambio }).ok).toBe(false);
    });
    it('rechaza cuerpos que no son objetos', () => {
        for (const b of [null, 'x', 5, [], undefined])
            expect((0, settings_1.validateUserSettings)(b).ok).toBe(false);
    });
});
describe('Qué cambios obligan a regenerar la rutina', () => {
    it.each([
        ['nivel', { nivelExperiencia: 'avanzado' }],
        ['días', { diasPorSemana: 3 }],
        ['minutos', { minutosPorSesion: 90 }],
        ['objetivo', { objetivo: 'hipertrofia' }],
        ['equipo', { equipamiento: ['barra'] }],
        ['lesión', { lesiones: ['rodilla'] }],
        ['músculo prioritario', { musculosPrioritarios: ['biceps'] }],
    ])('%s SÍ regenera', (_n, cambio) => {
        expect((0, settings_1.trainingFieldsChanged)(base(), { ...base(), ...cambio })).toBe(true);
    });
    it.each([
        ['peso', { pesoKg: 75 }],
        ['altura', { alturaCm: 180 }],
        ['peso objetivo', { pesoObjetivoKg: 70 }],
        ['orden del equipo', { equipamiento: ['banco', 'mancuernas'] }],
    ])('%s NO regenera', (_n, cambio) => {
        expect((0, settings_1.trainingFieldsChanged)(base(), { ...base(), ...cambio })).toBe(false);
    });
});
describe('ProfileApplicationService: guardar → regenerar rutina automáticamente', () => {
    it('el primer guardado crea la rutina (versión 1)', async () => {
        const { profile } = setup();
        const r = await profile.saveProfile('u1', base());
        expect(r.planRegenerado).toBe(true);
        expect(r.plan?.version).toBe(1);
        expect(r.plan?.plan.dias.length).toBe(5);
    });
    it('cambiar de 5 a 3 días ajusta la rutina a 3 días', async () => {
        const { profile } = setup();
        await profile.saveProfile('u1', base());
        const r = await profile.saveProfile('u1', { ...base(), diasPorSemana: 3 });
        expect(r.planRegenerado).toBe(true);
        expect(r.plan?.version).toBe(2);
        expect(r.plan?.plan.dias.length).toBe(3);
    });
    it('subir de 3 a 6 días también se adapta', async () => {
        const { profile } = setup();
        await profile.saveProfile('u1', { ...base(), diasPorSemana: 3 });
        const r = await profile.saveProfile('u1', { ...base(), diasPorSemana: 6 });
        expect(r.plan?.plan.dias.length).toBe(6);
    });
    it('cambiar el nivel cambia el programa (principiante → avanzado)', async () => {
        const { profile } = setup();
        const a = await profile.saveProfile('u1', { ...base(), objetivo: 'hipertrofia', nivelExperiencia: 'principiante' });
        expect(a.plan?.plan.nivelPrograma).toBe('foundation');
        const b = await profile.saveProfile('u1', { ...base(), objetivo: 'hipertrofia', nivelExperiencia: 'avanzado', equipamiento: ['barra', 'discos', 'rack', 'banco', 'mancuernas', 'poleas', 'maquinas'] });
        expect(b.plan?.plan.nivelPrograma).toBe('advanced');
    });
    it('volver de avanzado a principiante baja el programa a Foundation', async () => {
        const { profile } = setup();
        await profile.saveProfile('u1', { ...base(), nivelExperiencia: 'avanzado' });
        const r = await profile.saveProfile('u1', { ...base(), nivelExperiencia: 'principiante' });
        expect(r.plan?.plan.nivelPrograma).toBe('foundation');
    });
    it('cambiar SOLO el peso objetivo no toca la rutina', async () => {
        const { profile, planService } = setup();
        await profile.saveProfile('u1', base());
        const r = await profile.saveProfile('u1', { ...base(), pesoObjetivoKg: 70 });
        expect(r.planRegenerado).toBe(false);
        expect(r.plan).toBeNull();
        expect((await planService.getVersionHistory('u1')).length).toBe(1);
        expect((await profile.getProfile('u1')).pesoObjetivoKg).toBe(70);
    });
    it('guardar lo mismo dos veces no crea versiones de más', async () => {
        const { profile, planService } = setup();
        await profile.saveProfile('u1', base());
        await profile.saveProfile('u1', base());
        expect((await planService.getVersionHistory('u1')).length).toBe(1);
    });
    it('rechaza datos inválidos sin guardar nada', async () => {
        const { profile } = setup();
        await expect(profile.saveProfile('u1', { ...base(), edad: 3 })).rejects.toThrow();
        await expect(profile.getProfile('u1')).rejects.toThrow(/perfil/);
    });
    it('guarda TODOS los campos pedidos (incluida la salud)', async () => {
        const { profile } = setup();
        const completo = { ...base(), lesiones: ['rodilla'], dolorActual: ['hombro'], condicionMedica: true, musculosPrioritarios: ['biceps', 'gluteos'] };
        await profile.saveProfile('u1', completo);
        expect(await profile.getProfile('u1')).toEqual(completo);
    });
});
describe('Seguridad: lesiones y dolor → ejercicios que se evitan', () => {
    const equipo = ['mancuernas', 'barra', 'discos', 'rack', 'poleas', 'banco', 'maquinas', 'prensa', 'caminadora', 'bicicleta'];
    const plan = async (cambio) => {
        const { profile } = setup();
        const r = await profile.saveProfile('u1', { ...base(), nivelExperiencia: 'avanzado', objetivo: 'hipertrofia', equipamiento: equipo, ...cambio });
        return r.plan.plan;
    };
    const patronesDe = (p) => p.dias.flatMap((d) => d.ejercicios.map((e) => exercises_1.EXERCISES.find((x) => x.id === e.exerciseId).patron));
    it('dolor de hombro: ningún ejercicio de empuje y avisa que consulte a un profesional', async () => {
        const p = await plan({ dolorActual: ['hombro'] });
        expect(patronesDe(p)).not.toContain('push');
        expect(p.warnings.some((w) => w.codigo === 'CONSULTA_PROFESIONAL')).toBe(true);
        expect(p.warnings.some((w) => w.codigo === 'EJERCICIOS_OMITIDOS')).toBe(true);
    });
    it('rodilla: sin sentadillas/prensa/zancadas', async () => {
        expect(patronesDe(await plan({ lesiones: ['rodilla'] }))).not.toContain('squat');
    });
    it('espalda baja: sin bisagras de cadera (peso muerto)', async () => {
        expect(patronesDe(await plan({ dolorActual: ['espalda_baja'] }))).not.toContain('hinge');
    });
    it('muñeca: sin trabajo de antebrazo ni acarreos', async () => {
        const p = await plan({ lesiones: ['muneca'] });
        const ids = p.dias.flatMap((d) => d.ejercicios.map((e) => e.exerciseId));
        expect(ids).not.toContain('ex_wrist_curl');
        expect(ids).not.toContain('ex_farmer_carry');
    });
    it('una lesión antigua (sin dolor actual) omite el ejercicio pero NO exige consulta médica', async () => {
        const p = await plan({ lesiones: ['rodilla'] });
        expect(p.warnings.some((w) => w.codigo === 'CONSULTA_PROFESIONAL')).toBe(false);
    });
    it('una condición médica declarada exige consulta aunque no haya dolor', async () => {
        const p = await plan({ condicionMedica: true });
        expect(p.warnings.some((w) => w.codigo === 'CONSULTA_PROFESIONAL')).toBe(true);
    });
    it('con molestias en rodilla el cardio es siempre de bajo impacto', async () => {
        const { profile } = setup();
        const r = await profile.saveProfile('u1', { ...base(), nivelExperiencia: 'avanzado', objetivo: 'perdida_grasa', equipamiento: ['caminadora', 'bicicleta'], dolorActual: ['rodilla'] });
        const cardios = r.plan.plan.dias.filter((d) => d.cardio).map((d) => d.cardio.modalidad);
        expect(cardios.length).toBeGreaterThan(0);
        for (const c of cardios)
            expect(['Carrera', 'Intervalos']).not.toContain(c);
    });
    it('construirLimitaciones: sin nada declarado no restringe', () => {
        const l = (0, health_1.construirLimitaciones)([], [], false);
        expect(l.patronesExcluidos).toEqual([]);
        expect(l.requiereConsultaProfesional).toBe(false);
        expect((0, health_1.evitaAltoImpacto)(l)).toBe(false);
    });
    it('músculos prioritarios: el motor agrega un ejercicio extra para ese grupo', async () => {
        const sin = await plan({});
        const con = await plan({ musculosPrioritarios: ['biceps'] });
        const cuenta = (p) => p.dias.flatMap((d) => d.ejercicios).filter((e) => e.grupoPrimario === 'biceps').length;
        expect(cuenta(con)).toBeGreaterThan(cuenta(sin));
    });
});
describe('Niveles: qué programa se asigna y cuándo se desbloquea Olympia', () => {
    const input = (nivel, olympia, dias, semanas) => ({
        perfil: { edad: 30, sexo: 'masculino', pesoKg: 80, alturaCm: 178, nivelExperiencia: nivel },
        objetivo: 'hipertrofia', disponibilidad: { diasPorSemana: dias, minutosPorSesion: 60 }, equipamientoDisponible: [],
        preferencias: { musculosPrioritarios: [], modalidadCardioPreferida: [], ejerciciosExcluidosIds: [], ejerciciosFavoritosIds: [], solicitaOlympia: olympia },
        limitaciones: { lesiones: [], dolorActual: [], patronesExcluidos: [], ejerciciosExcluidosIds: [], requiereConsultaProfesional: false },
        historial: semanas === null ? null : { semanasEntrenando: semanas, adherenciaUltimasSemanas: 0.9, recoveryScorePromedio: 70, rirPromedioReciente: null, tendenciaRendimiento: 'estable' },
    });
    it('principiante → Foundation, intermedio → Growth, avanzado → Advanced', () => {
        expect((0, levelSelection_1.selectProgramLevel)(input('principiante', false, 5, null)).nivelPrograma).toBe('foundation');
        expect((0, levelSelection_1.selectProgramLevel)(input('intermedio', false, 5, null)).nivelPrograma).toBe('growth');
        expect((0, levelSelection_1.selectProgramLevel)(input('avanzado', false, 5, null)).nivelPrograma).toBe('advanced');
    });
    it('Olympia NO se concede a un principiante aunque lo pida', () => {
        expect((0, levelSelection_1.selectProgramLevel)(input('principiante', true, 6, 40)).nivelPrograma).toBe('foundation');
    });
    it('Olympia NO se concede sin historial real (pasa a Advanced)', () => {
        expect((0, levelSelection_1.selectProgramLevel)(input('avanzado', true, 6, null)).nivelPrograma).toBe('advanced');
        expect((0, levelSelection_1.selectProgramLevel)(input('avanzado', true, 6, 3)).nivelPrograma).toBe('advanced');
    });
    it('Olympia solo con ≥ 8 semanas, 6 días y recuperación saludable', () => {
        expect((0, levelSelection_1.selectProgramLevel)(input('avanzado', true, 6, 8)).nivelPrograma).toBe('olympia');
        expect((0, levelSelection_1.selectProgramLevel)(input('avanzado', true, 5, 20)).nivelPrograma).toBe('advanced');
    });
});
describe('Días de entrenamiento: todas las opciones 2-6 producen exactamente esa cantidad', () => {
    it.each([2, 3, 4, 5, 6])('%i días (hipertrofia y pérdida de grasa)', async (n) => {
        const { profile } = setup();
        for (const objetivo of ['hipertrofia', 'perdida_grasa']) {
            const r = await profile.saveProfile(`u-${objetivo}-${n}`, { ...base(), objetivo, diasPorSemana: n });
            expect(r.plan.plan.dias.length).toBe(n);
        }
    });
});
describe('Instrucciones de ejercicios', () => {
    it('cada ejercicio del plan incluye instrucciones y errores comunes del catálogo', () => {
        const p = (0, generatePlan_1.generateWorkoutPlan)({
            perfil: { edad: 25, sexo: 'masculino', pesoKg: 80, alturaCm: 178, nivelExperiencia: 'intermedio' },
            objetivo: 'hipertrofia', disponibilidad: { diasPorSemana: 5, minutosPorSesion: 60 }, equipamientoDisponible: ['mancuernas', 'banco', 'poleas', 'barra', 'discos', 'rack'],
            preferencias: { musculosPrioritarios: [], modalidadCardioPreferida: [], ejerciciosExcluidosIds: [], ejerciciosFavoritosIds: [], solicitaOlympia: false },
            limitaciones: { lesiones: [], dolorActual: [], patronesExcluidos: [], ejerciciosExcluidosIds: [], requiereConsultaProfesional: false },
            historial: null,
        });
        const ejercicios = p.dias.flatMap((d) => d.ejercicios);
        expect(ejercicios.length).toBeGreaterThan(10);
        for (const e of ejercicios) {
            expect(e.instrucciones.length).toBeGreaterThan(10);
            expect(Array.isArray(e.erroresComunes)).toBe(true);
        }
    });
});
describe('Imágenes de ejercicios', () => {
    const backup = process.env.EXERCISE_MEDIA_BASE_URL;
    afterEach(() => { if (backup === undefined)
        delete process.env.EXERCISE_MEDIA_BASE_URL;
    else
        process.env.EXERCISE_MEDIA_BASE_URL = backup; });
    it('todo ejercicio mapeado existe en NUESTRO catálogo (sin ids huérfanos)', () => {
        const ids = new Set(exercises_1.EXERCISES.map((e) => e.id));
        for (const k of Object.keys(exerciseMedia_1.EXERCISE_MEDIA))
            expect(ids.has(k)).toBe(true);
        expect(Object.keys(exerciseMedia_1.EXERCISE_MEDIA).length).toBe(50);
    });
    it('por defecto usa el CDN del repo y arma URLs absolutas', () => {
        delete process.env.EXERCISE_MEDIA_BASE_URL;
        const u = (0, exerciseMedia_1.mediaUrls)('ex_press_banca_barra');
        expect(u.imagenUrl).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/Nielide\/exercises-dataset@main\/images\/.+\.jpg$/);
        expect(u.gifUrl).toMatch(/\/videos\/.+\.gif$/);
    });
    it('un ejercicio sin equivalente queda sin imagen (null), no con una equivocada', () => {
        delete process.env.EXERCISE_MEDIA_BASE_URL;
        expect((0, exerciseMedia_1.mediaUrls)('ex_plancha')).toEqual({ imagenUrl: null, gifUrl: null });
    });
    it('EXERCISE_MEDIA_BASE_URL vacío apaga las imágenes (interruptor de licencia)', () => {
        process.env.EXERCISE_MEDIA_BASE_URL = '';
        expect((0, exerciseMedia_1.mediaBaseUrl)()).toBeNull();
        expect((0, exerciseMedia_1.mediaUrls)('ex_press_banca_barra')).toEqual({ imagenUrl: null, gifUrl: null });
    });
    it('acepta otra base propia y le agrega la barra final', () => {
        process.env.EXERCISE_MEDIA_BASE_URL = 'https://mi-bucket.example.com/media';
        expect((0, exerciseMedia_1.mediaUrls)('ex_flexiones').imagenUrl.startsWith('https://mi-bucket.example.com/media/images/')).toBe(true);
    });
    it('withMedia agrega las URLs al plan sin tocar el resto', async () => {
        delete process.env.EXERCISE_MEDIA_BASE_URL;
        const { profile } = setup();
        const r = await profile.saveProfile('u1', base());
        const conMedia = (0, media_1.withMedia)(r.plan);
        const e = conMedia.plan.dias.flatMap((d) => d.ejercicios).find((x) => x.exerciseId === 'ex_press_banca_mancuernas');
        expect(e.imagenUrl).toContain('cdn.jsdelivr.net');
        expect(conMedia.version).toBe(r.plan.version);
    });
});
describe('Registro de peso y progreso', () => {
    it('registra pesos, los devuelve en orden cronológico y actualiza el peso del perfil', async () => {
        const { profile, progress } = setup();
        await profile.saveProfile('u1', base());
        await progress.addWeight('u1', { pesoKg: 80 });
        await new Promise((r) => setTimeout(r, 3));
        await progress.addWeight('u1', { pesoKg: 79.26 });
        const h = await progress.getHistory('u1');
        expect(h.registros.map((r) => r.pesoKg)).toEqual([80, 79.3]);
        expect(h.pesoObjetivoKg).toBe(72);
        expect((await profile.getProfile('u1')).pesoKg).toBe(79.3);
    });
    it.each([[5], [500], ['80'], [null], [NaN]])('rechaza pesos inválidos (%s)', async (kg) => {
        const { progress } = setup();
        await expect(progress.addWeight('u1', { pesoKg: kg })).rejects.toThrow();
        await expect(progress.addWeight('u1', null)).rejects.toThrow();
    });
    it('sin perfil igual permite registrar peso y no revienta', async () => {
        const { progress } = setup();
        await expect(progress.addWeight('u1', { pesoKg: 70 })).resolves.toBeDefined();
        expect((await progress.getHistory('u1')).pesoObjetivoKg).toBeNull();
    });
    it('no mezcla usuarios', async () => {
        const { progress } = setup();
        await progress.addWeight('a', { pesoKg: 70 });
        await progress.addWeight('b', { pesoKg: 90 });
        expect((await progress.getHistory('a')).registros.map((r) => r.pesoKg)).toEqual([70]);
    });
});
