"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryPlanRepository = void 0;
const common_1 = require("@nestjs/common");
const exercises_1 = require("../../data/exercises");
const crypto_1 = require("crypto");
/**
 * Implementación en memoria, útil para tests y para desarrollo local sin
 * levantar PostgreSQL. Implementa exactamente el mismo contrato que la
 * versión Prisma (ver persistence/prisma), por lo que los servicios de
 * aplicación que dependen del puerto no notan la diferencia.
 */
let InMemoryPlanRepository = class InMemoryPlanRepository {
    constructor() {
        this.plans = [];
    }
    async findActiveByUser(userId) {
        return this.plans.find((p) => p.userId === userId && p.activo) ?? null;
    }
    async saveNewVersion(userId, plan, _catalog) {
        const versionesPrevias = this.plans.filter((p) => p.userId === userId);
        const siguienteVersion = versionesPrevias.length + 1;
        // Regla de negocio (documento de diseño, sección 5 del modelo de datos):
        // nunca se muta un plan existente; se crea una nueva versión y se
        // desactivan todas las anteriores del usuario.
        for (const p of versionesPrevias) {
            p.activo = false;
        }
        const nuevoId = (0, crypto_1.randomUUID)();
        // Cada día recibe un id propio (aunque esta implementación no tenga
        // tablas separadas): es lo que permite al cliente decir "quiero iniciar
        // una sesión sobre el día 3 de mi plan actual" de forma no ambigua,
        // igual que ocurre con WorkoutDay.id en la versión Prisma.
        const planConDiasConId = {
            ...plan,
            dias: plan.dias.map((dia) => ({ ...dia, id: `${nuevoId}_dia_${dia.orden}` })),
        };
        const nuevo = {
            id: nuevoId,
            userId,
            version: siguienteVersion,
            activo: true,
            plan: planConDiasConId,
            createdAt: new Date(),
        };
        this.plans.push(nuevo);
        return nuevo;
    }
    async findAllVersionsByUser(userId) {
        return this.plans
            .filter((p) => p.userId === userId)
            .sort((a, b) => a.version - b.version);
    }
    async substituteExercise(userId, workoutDayId, oldExerciseId, newExerciseId, motivo, catalog) {
        const planIndex = this.plans.findIndex((p) => p.userId === userId && p.activo);
        if (planIndex === -1) {
            throw new common_1.NotFoundException('No active plan found for user');
        }
        const plan = this.plans[planIndex];
        const dia = plan.plan.dias.find((d) => d.id === workoutDayId);
        if (!dia) {
            throw new common_1.NotFoundException(`Workout day ${workoutDayId} not found in active plan`);
        }
        const ejercicioIndex = dia.ejercicios.findIndex((e) => e.exerciseId === oldExerciseId);
        if (ejercicioIndex === -1) {
            throw new common_1.NotFoundException(`Exercise ${oldExerciseId} not found in workout day ${workoutDayId}`);
        }
        // Validar que el nuevo ejercicio existe en el catálogo
        const ejercicios = catalog && catalog.length ? catalog : exercises_1.EXERCISES;
        const nuevoEjercicio = ejercicios.find((e) => e.id === newExerciseId);
        if (!nuevoEjercicio) {
            throw new common_1.NotFoundException(`Replacement exercise ${newExerciseId} not found in catalog`);
        }
        // Sustituir el ejercicio manteniendo la misma estructura
        const ejercicioActual = dia.ejercicios[ejercicioIndex];
        dia.ejercicios[ejercicioIndex] = {
            ...ejercicioActual,
            exerciseId: newExerciseId,
            sustituidoDesde: oldExerciseId,
            motivoSustitucion: motivo,
        };
        // El plan ya está actualizado (mutación in-place para in-memory)
        return plan;
    }
};
exports.InMemoryPlanRepository = InMemoryPlanRepository;
exports.InMemoryPlanRepository = InMemoryPlanRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryPlanRepository);
