"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InMemorySessionRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let InMemorySessionRepository = InMemorySessionRepository_1 = class InMemorySessionRepository {
    constructor() {
        this.sessions = [];
        this.sets = [];
    }
    async startSession(input) {
        const nueva = {
            id: (0, crypto_1.randomUUID)(),
            userId: input.userId,
            workoutDayId: input.workoutDayId,
            fecha: new Date(),
            estado: 'en_progreso',
        };
        this.sessions.push(nueva);
        return nueva;
    }
    async logSet(input) {
        const session = this.sessions.find((s) => s.id === input.sessionId && s.userId === input.userId);
        if (!session) {
            throw new common_1.NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
        }
        // Idempotente: la serie N de un ejercicio en una sesión es única. Si el
        // cliente reintenta (se cortó la red tras guardar), se actualiza en vez de duplicar.
        const existente = this.sets.find((s) => s.sessionId === input.sessionId &&
            s.exerciseId === input.exerciseId &&
            s.numeroSerie === input.numeroSerie);
        if (existente) {
            existente.pesoKg = input.pesoKg;
            existente.repsRealizadas = input.repsRealizadas;
            existente.rirReportado = input.rirReportado;
            existente.repsObjetivoMax = input.repsObjetivoMax;
            return existente;
        }
        const nuevo = {
            id: (0, crypto_1.randomUUID)(),
            sessionId: input.sessionId,
            userId: input.userId,
            exerciseId: input.exerciseId,
            fecha: new Date(),
            numeroSerie: input.numeroSerie,
            pesoKg: input.pesoKg,
            repsRealizadas: input.repsRealizadas,
            rirReportado: input.rirReportado,
            repsObjetivoMax: input.repsObjetivoMax,
        };
        this.sets.push(nuevo);
        return nuevo;
    }
    async findLastCompletedSession(userId, workoutDayIds) {
        const ids = new Set(workoutDayIds);
        const candidatas = this.sessions
            .filter((s) => s.userId === userId && s.estado === 'completada' && ids.has(s.workoutDayId))
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
        return candidatas[0] ?? null;
    }
    async finishSession(input) {
        const session = this.sessions.find((s) => s.id === input.sessionId && s.userId === input.userId);
        if (!session) {
            throw new common_1.NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
        }
        const setsDeLaSesion = this.sets.filter((s) => s.sessionId === input.sessionId);
        const totalSeries = setsDeLaSesion.length;
        const totalRepeticiones = setsDeLaSesion.reduce((acc, s) => acc + s.repsRealizadas, 0);
        const volumenTotalKg = setsDeLaSesion.reduce((acc, s) => acc + s.pesoKg * s.repsRealizadas, 0);
        const ejerciciosRealizados = new Set(setsDeLaSesion.map((s) => s.exerciseId)).size;
        const estadoFinal = input.estado ?? (totalSeries > 0 ? 'completada' : 'parcial');
        session.estado = estadoFinal;
        const exerciseIdsDeEstaSesion = new Set(setsDeLaSesion.map((s) => s.exerciseId));
        this.pruneOldSetsForExercises(input.userId, exerciseIdsDeEstaSesion);
        return {
            sessionId: input.sessionId,
            duracionRealSeg: input.duracionRealSeg,
            totalSeries,
            totalRepeticiones,
            volumenTotalKg,
            ejerciciosRealizados,
            estado: estadoFinal,
        };
    }
    /**
     * Conserva, por cada ejercicio tocado en la sesión recién cerrada, solo
     * las series de las últimas RETENCION_SESIONES_POR_EJERCICIO sesiones
     * (por fecha) de ese usuario para ese ejercicio; borra el resto. Se
     * ejecuta al finalizar cada sesión para que la tabla nunca crezca sin
     * límite en el plan gratuito.
     */
    pruneOldSetsForExercises(userId, exerciseIds) {
        for (const exerciseId of exerciseIds) {
            const sessionIdsConFecha = [
                ...new Set(this.sets
                    .filter((s) => s.userId === userId && s.exerciseId === exerciseId)
                    .map((s) => s.sessionId)),
            ].map((sessionId) => ({
                sessionId,
                fecha: this.sessions.find((se) => se.id === sessionId)?.fecha ?? new Date(0),
            }));
            sessionIdsConFecha.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
            const sesionesAConservar = new Set(sessionIdsConFecha
                .slice(0, InMemorySessionRepository_1.RETENCION_SESIONES_POR_EJERCICIO)
                .map((s) => s.sessionId));
            this.sets = this.sets.filter((s) => !(s.userId === userId && s.exerciseId === exerciseId) || sesionesAConservar.has(s.sessionId));
        }
    }
    async findRecentSessionLogs(userId, exerciseId, limitSesiones) {
        const propios = this.sets.filter((s) => s.userId === userId && s.exerciseId === exerciseId);
        // Agrupar por sessionId (cada sesión = 1 entrenamiento con N series).
        const porSesion = new Map();
        for (const s of propios) {
            const lista = porSesion.get(s.sessionId) ?? [];
            lista.push(s);
            porSesion.set(s.sessionId, lista);
        }
        const sesiones = Array.from(porSesion.entries()).map(([, sets]) => ({
            fecha: sets[0].fecha.toISOString(),
            repsObjetivoMax: sets[0].repsObjetivoMax,
            sets: sets
                .sort((a, b) => a.numeroSerie - b.numeroSerie)
                .map((s) => ({
                pesoKg: s.pesoKg,
                repsRealizadas: s.repsRealizadas,
                rirReportado: s.rirReportado ?? 2, // si no se reportó, se asume conservador (RIR medio)
            })),
        }));
        // Ordenar por fecha ascendente (la más antigua primero, como espera
        // decideAdaptation) y devolver solo las últimas `limitSesiones`.
        sesiones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        return sesiones.slice(-limitSesiones);
    }
};
exports.InMemorySessionRepository = InMemorySessionRepository;
// DECISIÓN DE ARQUITECTURA (ver documentación de datos): con un plan
// gratuito de Supabase, la nube NO debe acumular historial ilimitado.
// El motor de adaptación solo necesita las últimas 2-3 sesiones por
// ejercicio; se conserva un margen (8) y se descarta el resto. El
// historial completo, sin límite, vive únicamente en el dispositivo
// (Room, en la app Android) y se pierde si el usuario desinstala — es un
// trade-off aceptado para mantener el costo de infraestructura en cero.
InMemorySessionRepository.RETENCION_SESIONES_POR_EJERCICIO = 8;
exports.InMemorySessionRepository = InMemorySessionRepository = InMemorySessionRepository_1 = __decorate([
    (0, common_1.Injectable)()
], InMemorySessionRepository);
