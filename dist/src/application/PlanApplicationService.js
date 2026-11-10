"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanApplicationService = void 0;
const exercises_1 = require("../data/exercises");
const health_1 = require("../domain/health");
const generatePlan_1 = require("../engine/generatePlan");
const common_1 = require("@nestjs/common");
/**
 * Orquesta: construir el historial real desde los repositorios + invocar el
 * motor determinista + persistir la nueva versión. Ninguna decisión de
 * entrenamiento se toma aquí; solo se ensambla el input y se guarda el
 * output. Esto corresponde al bloque "Motor de reglas -> Plan -> Validación"
 * del pipeline de IA (sección 27 del documento de diseño).
 */
class PlanApplicationService {
    constructor(planRepo, recoveryRepo) {
        this.planRepo = planRepo;
        this.recoveryRepo = recoveryRepo;
    }
    async generateAndPersist(userId, partialInput, historialManual) {
        const historial = historialManual ??
            (await this.buildHistorialFromRepos(userId));
        const input = { ...partialInput, historial };
        const plan = (0, generatePlan_1.generateWorkoutPlan)(input);
        return this.planRepo.saveNewVersion(userId, plan);
    }
    /**
     * Genera y guarda una NUEVA versión de la rutina a partir de los ajustes
     * guardados del usuario (nivel, objetivo, días, equipo, salud...). Es el
     * único camino por el que se regenera la rutina al cambiar la configuración.
     */
    async generateFromSettings(userId, s) {
        return this.generateAndPersist(userId, {
            perfil: {
                edad: s.edad,
                sexo: s.sexo,
                pesoKg: s.pesoKg,
                alturaCm: s.alturaCm,
                nivelExperiencia: s.nivelExperiencia,
            },
            objetivo: s.objetivo,
            disponibilidad: { diasPorSemana: s.diasPorSemana, minutosPorSesion: s.minutosPorSesion },
            equipamientoDisponible: s.equipamiento,
            preferencias: {
                musculosPrioritarios: s.musculosPrioritarios,
                modalidadCardioPreferida: [],
                ejerciciosExcluidosIds: [],
                ejerciciosFavoritosIds: [],
                solicitaOlympia: false, // Olympia no se pide desde la app: ver levelSelection
            },
            limitaciones: (0, health_1.construirLimitaciones)(s.lesiones, s.dolorActual, s.condicionMedica),
        });
    }
    async getActivePlan(userId) {
        return this.planRepo.findActiveByUser(userId);
    }
    async getVersionHistory(userId) {
        return this.planRepo.findAllVersionsByUser(userId);
    }
    /**
     * Sustituye un ejercicio en el plan activo por otro del mismo grupo muscular.
     * Valida que el nuevo ejercicio es una alternativa válida (está en la lista
     * de alternativas del ejercicio original o comparte el mismo grupo primario).
     */
    async substituteExercise(userId, workoutDayId, oldExerciseId, newExerciseId, motivo) {
        // 1. Obtener el plan activo para validar
        const plan = await this.planRepo.findActiveByUser(userId);
        if (!plan) {
            throw new common_1.NotFoundException('No tienes un plan activo. Genera uno primero.');
        }
        // 2. Encontrar el día y el ejercicio original
        const dia = plan.plan.dias.find((d) => d.id === workoutDayId);
        if (!dia) {
            throw new common_1.NotFoundException('Día de entrenamiento no encontrado en el plan activo.');
        }
        const ejercicioOriginal = dia.ejercicios.find((e) => e.exerciseId === oldExerciseId);
        if (!ejercicioOriginal) {
            throw new common_1.NotFoundException('Ejercicio no encontrado en el día especificado.');
        }
        // 3. Validar que el nuevo ejercicio existe
        const nuevoEjercicio = exercises_1.EXERCISES.find((e) => e.id === newExerciseId);
        if (!nuevoEjercicio) {
            throw new common_1.BadRequestException('El ejercicio de sustitución no existe en el catálogo.');
        }
        // 4. Validar que el nuevo ejercicio es una alternativa válida
        const ejercicioOriginalCatalogo = exercises_1.EXERCISES.find((e) => e.id === oldExerciseId);
        const esAlternativaValida = ejercicioOriginalCatalogo?.alternativas.includes(newExerciseId) ??
            false;
        const mismoGrupoPrimario = ejercicioOriginalCatalogo?.grupoPrimario === nuevoEjercicio.grupoPrimario;
        if (!esAlternativaValida && !mismoGrupoPrimario) {
            throw new common_1.BadRequestException('El ejercicio seleccionado no es una alternativa válida para este grupo muscular.');
        }
        // 5. Persistir la sustitución
        return this.planRepo.substituteExercise(userId, workoutDayId, oldExerciseId, newExerciseId, motivo);
    }
    async buildHistorialFromRepos(userId) {
        const recoveryScorePromedio = await this.recoveryRepo.averageRecentRecoveryScore(userId, 7);
        const versiones = await this.planRepo.findAllVersionsByUser(userId);
        if (versiones.length === 0) {
            return null; // usuario nuevo, sin historial
        }
        // Estimación simple de semanas entrenando a partir de la primera versión
        // del plan. En producción esto se refina con fechas reales de sesiones.
        const primeraVersion = versiones[0];
        const semanasEntrenando = Math.max(1, Math.round((Date.now() - primeraVersion.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)));
        return {
            semanasEntrenando,
            adherenciaUltimasSemanas: 0.8, // TODO(fase-1): calcular real desde WorkoutSession completadas/planificadas
            recoveryScorePromedio,
            rirPromedioReciente: null,
            tendenciaRendimiento: 'estable',
        };
    }
}
exports.PlanApplicationService = PlanApplicationService;
