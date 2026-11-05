"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanApplicationService = void 0;
const health_1 = require("../domain/health");
const generatePlan_1 = require("../engine/generatePlan");
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
