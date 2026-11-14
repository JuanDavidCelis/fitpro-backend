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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPlanRepository = void 0;
const common_1 = require("@nestjs/common");
const exercises_1 = require("../../data/exercises");
const PrismaService_1 = require("./PrismaService");
const planMapper_1 = require("./planMapper");
const DIA_INCLUDE = {
    dias: {
        include: {
            ejercicios: {
                include: { exercise: true },
            },
        },
    },
};
/**
 * ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts).
 * Escribe/lee el plan de forma completamente relacional, tal como está
 * modelado en schema.prisma (WorkoutPlan -> WorkoutDay -> WorkoutExercise).
 * Requiere que el catálogo de ejercicios ya esté sembrado (prisma/seed.ts)
 * antes de poder crear un WorkoutExercise (FK a Exercise.id).
 */
let PrismaPlanRepository = class PrismaPlanRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findActiveByUser(userId) {
        const row = await this.prisma.workoutPlan.findFirst({
            where: { userId, activo: true },
            include: DIA_INCLUDE,
        });
        if (!row)
            return null;
        return this.toStoredPlan(row);
    }
    async saveNewVersion(userId, plan, catalog) {
        return this.prisma.$transaction(async (tx) => {
            const versionesPrevias = await tx.workoutPlan.count({ where: { userId } });
            await tx.workoutPlan.updateMany({
                where: { userId, activo: true },
                data: { activo: false },
            });
            // Asegura que el catálogo de ejercicios exista (FK de WorkoutExercise).
            // Usa el catálogo efectivo (incluye ejercicios nuevos de BD) y, si falta
            // metadata, toma la embebida en el plan generado.
            const fuente = catalog && catalog.length ? catalog : exercises_1.EXERCISES;
            const byId = new Map(fuente.map((e) => [e.id, e]));
            for (const dia of plan.dias) {
                for (const ej of dia.ejercicios) {
                    const ex = byId.get(ej.exerciseId) ?? exercises_1.EXERCISES.find((e) => e.id === ej.exerciseId);
                    const data = ex ?? {
                        id: ej.exerciseId,
                        nombre: ej.nombre,
                        grupoPrimario: ej.grupoPrimario,
                        gruposSecundarios: [],
                        equipamientoRequerido: [],
                        nivelMinimo: plan.nivelPrograma,
                        patron: 'push',
                        instrucciones: ej.instrucciones ?? '',
                        erroresComunes: ej.erroresComunes ?? [],
                        etiquetas: [],
                        alternativas: ej.alternativas ?? [],
                    };
                    await tx.exercise.upsert({
                        where: { id: ej.exerciseId },
                        update: {
                            nombre: data.nombre,
                            grupoPrimario: data.grupoPrimario,
                            gruposSecundarios: data.gruposSecundarios,
                            equipamientoRequerido: data.equipamientoRequerido,
                            nivelMinimo: data.nivelMinimo,
                            patron: data.patron,
                            instrucciones: data.instrucciones,
                            erroresComunes: data.erroresComunes,
                            etiquetas: data.etiquetas,
                            alternativas: data.alternativas,
                        },
                        create: {
                            id: data.id,
                            nombre: data.nombre,
                            grupoPrimario: data.grupoPrimario,
                            gruposSecundarios: data.gruposSecundarios,
                            equipamientoRequerido: data.equipamientoRequerido,
                            nivelMinimo: data.nivelMinimo,
                            patron: data.patron,
                            instrucciones: data.instrucciones,
                            erroresComunes: data.erroresComunes,
                            etiquetas: data.etiquetas,
                            alternativas: data.alternativas,
                        },
                    });
                }
            }
            const creado = await tx.workoutPlan.create({
                data: {
                    userId,
                    nivelPrograma: plan.nivelPrograma,
                    nivelSolicitado: plan.nivelSolicitado,
                    diasPorSemana: plan.dias.length,
                    minutosPorSesion: 0, // TODO(fase-1): propagar minutosPorSesion real del input al output del motor
                    version: versionesPrevias + 1,
                    activo: true,
                    warningsJson: plan.warnings,
                    traceJson: plan.trace,
                    dias: {
                        create: plan.dias.map((dia) => ({
                            orden: dia.orden,
                            nombre: dia.nombre,
                            gruposMusculares: dia.gruposMusculares,
                            cardioModalidad: dia.cardio?.modalidad ?? null,
                            cardioDuracionMin: dia.cardio?.duracionMin ?? null,
                            cardioIntensidad: dia.cardio?.intensidad ?? null,
                            cardioMotivo: dia.cardio?.motivo ?? null,
                            ejercicios: {
                                create: dia.ejercicios.map((ej, idx) => ({
                                    orden: idx + 1,
                                    exerciseId: ej.exerciseId,
                                    series: ej.series,
                                    repsMin: ej.repsMin,
                                    repsMax: ej.repsMax,
                                    descansoSeg: ej.descansoSeg,
                                    rirObjetivo: ej.rirObjetivo,
                                    esSuperset: ej.esSuperset,
                                    grupoSupersetId: ej.grupoSupersetId,
                                    sustituidoDesde: ej.sustituidoDesde,
                                    motivoSustitucion: ej.motivoSustitucion,
                                })),
                            },
                        })),
                    },
                },
                include: DIA_INCLUDE,
            });
            return this.toStoredPlan(creado);
        });
    }
    async findAllVersionsByUser(userId) {
        const rows = await this.prisma.workoutPlan.findMany({
            where: { userId },
            include: DIA_INCLUDE,
            orderBy: { version: 'asc' },
        });
        return rows.map((r) => this.toStoredPlan(r));
    }
    async substituteExercise(userId, workoutDayId, oldExerciseId, newExerciseId, motivo, catalog) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Obtener el plan activo con sus días y ejercicios
            const plan = await tx.workoutPlan.findFirst({
                where: { userId, activo: true },
                include: DIA_INCLUDE,
            });
            if (!plan) {
                throw new common_1.NotFoundException('No active plan found for user');
            }
            // 2. Encontrar el día y el ejercicio a sustituir
            const dia = plan.dias.find((d) => d.id === workoutDayId);
            if (!dia) {
                throw new common_1.NotFoundException(`Workout day ${workoutDayId} not found in active plan`);
            }
            const ejercicioActual = dia.ejercicios.find((e) => e.exerciseId === oldExerciseId);
            if (!ejercicioActual) {
                throw new common_1.NotFoundException(`Exercise ${oldExerciseId} not found in workout day ${workoutDayId}`);
            }
            // 3. Obtener/asegurar el nuevo ejercicio del catálogo
            let nuevoEjercicio = await tx.exercise.findUnique({ where: { id: newExerciseId } });
            if (!nuevoEjercicio) {
                const fuente = catalog && catalog.length ? catalog : exercises_1.EXERCISES;
                const ex = fuente.find((e) => e.id === newExerciseId);
                if (!ex) {
                    throw new common_1.NotFoundException(`Replacement exercise ${newExerciseId} not found in catalog`);
                }
                nuevoEjercicio = await tx.exercise.upsert({
                    where: { id: ex.id },
                    update: {
                        nombre: ex.nombre,
                        grupoPrimario: ex.grupoPrimario,
                        gruposSecundarios: ex.gruposSecundarios,
                        equipamientoRequerido: ex.equipamientoRequerido,
                        nivelMinimo: ex.nivelMinimo,
                        patron: ex.patron,
                        instrucciones: ex.instrucciones,
                        erroresComunes: ex.erroresComunes,
                        etiquetas: ex.etiquetas,
                        alternativas: ex.alternativas,
                    },
                    create: {
                        id: ex.id,
                        nombre: ex.nombre,
                        grupoPrimario: ex.grupoPrimario,
                        gruposSecundarios: ex.gruposSecundarios,
                        equipamientoRequerido: ex.equipamientoRequerido,
                        nivelMinimo: ex.nivelMinimo,
                        patron: ex.patron,
                        instrucciones: ex.instrucciones,
                        erroresComunes: ex.erroresComunes,
                        etiquetas: ex.etiquetas,
                        alternativas: ex.alternativas,
                    },
                });
            }
            // 4. Eliminar el ejercicio antiguo y crear el nuevo en su lugar
            await tx.workoutExercise.delete({ where: { id: ejercicioActual.id } });
            const nuevoEjercicioPlan = await tx.workoutExercise.create({
                data: {
                    dayId: workoutDayId,
                    exerciseId: newExerciseId,
                    orden: ejercicioActual.orden,
                    series: ejercicioActual.series,
                    repsMin: ejercicioActual.repsMin,
                    repsMax: ejercicioActual.repsMax,
                    descansoSeg: ejercicioActual.descansoSeg,
                    rirObjetivo: ejercicioActual.rirObjetivo,
                    esSuperset: ejercicioActual.esSuperset,
                    grupoSupersetId: ejercicioActual.grupoSupersetId,
                    sustituidoDesde: oldExerciseId,
                    motivoSustitucion: motivo,
                },
                include: { exercise: true },
            });
            // 5. Reconstruir el plan completo actualizado y devolverlo
            const planActualizado = await tx.workoutPlan.findUnique({
                where: { id: plan.id },
                include: DIA_INCLUDE,
            });
            return this.toStoredPlan(planActualizado);
        });
    }
    toStoredPlan(row) {
        return {
            id: row.id,
            userId: row.userId,
            version: row.version,
            activo: row.activo,
            plan: (0, planMapper_1.planRowToResult)(row),
            createdAt: row.createdAt,
        };
    }
};
exports.PrismaPlanRepository = PrismaPlanRepository;
exports.PrismaPlanRepository = PrismaPlanRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PrismaService_1.PrismaService])
], PrismaPlanRepository);
