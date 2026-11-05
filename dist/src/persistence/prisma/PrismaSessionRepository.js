"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaSessionRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSessionRepository = void 0;
const common_1 = require("@nestjs/common");
const PrismaService_1 = require("./PrismaService");
/**
 * ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts).
 *
 * Restricción real del esquema relacional: `ExerciseSet` cuelga de
 * `WorkoutExercise` (la instancia planificada de un ejercicio dentro de un
 * día concreto), no directamente de `Exercise`. Por eso registrar una serie
 * requiere que ya exista una `WorkoutSession` — de ahí que startSession()
 * sea un paso obligatorio antes de logSet().
 */
let PrismaSessionRepository = PrismaSessionRepository_1 = class PrismaSessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startSession(input) {
        const created = await this.prisma.workoutSession.create({
            data: {
                userId: input.userId,
                workoutDayId: input.workoutDayId,
                estado: 'en_progreso',
            },
        });
        return {
            id: created.id,
            userId: created.userId,
            workoutDayId: created.workoutDayId,
            fecha: created.fecha,
            estado: created.estado,
        };
    }
    async logSet(input) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: input.sessionId },
            include: { workoutDay: { include: { ejercicios: true } } },
        });
        if (!session || session.userId !== input.userId) {
            throw new common_1.NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
        }
        const workoutExercise = session.workoutDay.ejercicios.find((we) => we.exerciseId === input.exerciseId);
        if (!workoutExercise) {
            throw new common_1.NotFoundException(`El ejercicio ${input.exerciseId} no pertenece al día planificado de esta sesión`);
        }
        // Idempotente: la serie N de un ejercicio en una sesión es única. Si el
        // cliente reintenta (se cortó la red tras guardar), se actualiza en vez de duplicar.
        const existente = await this.prisma.exerciseSet.findFirst({
            where: {
                sessionId: input.sessionId,
                workoutExerciseId: workoutExercise.id,
                numeroSerie: input.numeroSerie,
            },
        });
        const datos = {
            pesoKg: input.pesoKg,
            repsRealizadas: input.repsRealizadas,
            rirReportado: input.rirReportado,
        };
        const created = existente
            ? await this.prisma.exerciseSet.update({ where: { id: existente.id }, data: datos })
            : await this.prisma.exerciseSet.create({
                data: {
                    sessionId: input.sessionId,
                    workoutExerciseId: workoutExercise.id,
                    numeroSerie: input.numeroSerie,
                    ...datos,
                },
            });
        return {
            id: created.id,
            sessionId: input.sessionId,
            userId: input.userId,
            exerciseId: input.exerciseId,
            fecha: created.createdAt,
            numeroSerie: created.numeroSerie,
            pesoKg: created.pesoKg,
            repsRealizadas: created.repsRealizadas,
            rirReportado: created.rirReportado,
            repsObjetivoMax: input.repsObjetivoMax,
        };
    }
    async findLastCompletedSession(userId, workoutDayIds) {
        if (workoutDayIds.length === 0)
            return null;
        const row = await this.prisma.workoutSession.findFirst({
            where: { userId, estado: 'completada', workoutDayId: { in: workoutDayIds } },
            orderBy: { fecha: 'desc' },
        });
        if (!row)
            return null;
        return {
            id: row.id,
            userId: row.userId,
            workoutDayId: row.workoutDayId,
            fecha: row.fecha,
            estado: row.estado,
        };
    }
    async finishSession(input) {
        const session = await this.prisma.workoutSession.findUnique({
            where: { id: input.sessionId },
            include: { sets: true },
        });
        if (!session || session.userId !== input.userId) {
            throw new common_1.NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
        }
        const sets = session.sets;
        const totalSeries = sets.length;
        const totalRepeticiones = sets.reduce((acc, s) => acc + s.repsRealizadas, 0);
        const volumenTotalKg = sets.reduce((acc, s) => acc + s.pesoKg * s.repsRealizadas, 0);
        const ejerciciosRealizados = new Set(sets.map((s) => s.workoutExerciseId)).size;
        const estadoFinal = input.estado ?? (totalSeries > 0 ? 'completada' : 'parcial');
        await this.prisma.workoutSession.update({
            where: { id: input.sessionId },
            data: {
                estado: estadoFinal,
                duracionRealSeg: input.duracionRealSeg,
                fatigaPercibida: input.fatigaPercibida ?? null,
            },
        });
        const exerciseIdsDeEstaSesion = new Set(sets.map((s) => s.workoutExercise?.exerciseId).filter(Boolean));
        await this.pruneOldSetsForExercises(input.userId, exerciseIdsDeEstaSesion);
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
     * Equivalente relacional de la poda en memoria: por cada ejercicio de la
     * sesión recién cerrada, busca las sesiones de este usuario que incluyeron
     * ese ejercicio, ordenadas por fecha, y borra los ExerciseSet de las que
     * excedan la ventana de retención. No borra las sesiones en sí (quedan
     * como registro de adherencia/racha), solo el detalle serie a serie.
     */
    async pruneOldSetsForExercises(userId, exerciseIds) {
        for (const exerciseId of exerciseIds) {
            const sesionesConEsteEjercicio = await this.prisma.workoutSession.findMany({
                where: { userId, workoutDay: { ejercicios: { some: { exerciseId } } } },
                orderBy: { fecha: 'desc' },
                select: { id: true },
            });
            const idsAConservar = new Set(sesionesConEsteEjercicio
                .slice(0, PrismaSessionRepository_1.RETENCION_SESIONES_POR_EJERCICIO)
                .map((s) => s.id));
            const idsAPodar = sesionesConEsteEjercicio
                .map((s) => s.id)
                .filter((id) => !idsAConservar.has(id));
            if (idsAPodar.length === 0)
                continue;
            await this.prisma.exerciseSet.deleteMany({
                where: {
                    sessionId: { in: idsAPodar },
                    workoutExercise: { exerciseId },
                },
            });
        }
    }
    async findRecentSessionLogs(userId, exerciseId, limitSesiones) {
        const sessions = await this.prisma.workoutSession.findMany({
            where: {
                userId,
                workoutDay: { ejercicios: { some: { exerciseId } } },
            },
            orderBy: { fecha: 'desc' },
            take: limitSesiones,
            include: {
                sets: { include: { workoutExercise: true } },
            },
        });
        const logs = sessions
            .map((s) => {
            const setsDelEjercicio = s.sets.filter((set) => set.workoutExercise.exerciseId === exerciseId);
            if (setsDelEjercicio.length === 0)
                return null;
            return {
                fecha: s.fecha.toISOString(),
                repsObjetivoMax: setsDelEjercicio[0].workoutExercise.repsMax,
                sets: setsDelEjercicio
                    .sort((a, b) => a.numeroSerie - b.numeroSerie)
                    .map((set) => ({
                    pesoKg: set.pesoKg,
                    repsRealizadas: set.repsRealizadas,
                    rirReportado: set.rirReportado ?? 2,
                })),
            };
        })
            .filter((l) => l !== null)
            .reverse();
        return logs;
    }
};
exports.PrismaSessionRepository = PrismaSessionRepository;
// Ver la misma constante y justificación en InMemorySessionRepository:
// límite de retención para no agotar el plan gratuito de Supabase. El
// historial completo sin límite vive solo en el dispositivo (Room).
PrismaSessionRepository.RETENCION_SESIONES_POR_EJERCICIO = 8;
exports.PrismaSessionRepository = PrismaSessionRepository = PrismaSessionRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PrismaService_1.PrismaService])
], PrismaSessionRepository);
