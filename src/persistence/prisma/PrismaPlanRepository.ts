import { Injectable, NotFoundException } from '@nestjs/common';
import { Exercise, WorkoutPlanResult } from '../../domain/types';
import { EXERCISES as DEFAULT_EXERCISES } from '../../data/exercises';
import { PlanRepositoryPort, StoredPlan } from '../ports/repositories';
import { PrismaService } from './PrismaService';
import { planRowToResult, PrismaWorkoutPlanRow } from './planMapper';

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
@Injectable()
export class PrismaPlanRepository implements PlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUser(userId: string): Promise<StoredPlan | null> {
    const row = await this.prisma.workoutPlan.findFirst({
      where: { userId, activo: true },
      include: DIA_INCLUDE,
    });
    if (!row) return null;
    return this.toStoredPlan(row as PrismaWorkoutPlanRow);
  }

  async saveNewVersion(userId: string, plan: WorkoutPlanResult, catalog?: Exercise[]): Promise<StoredPlan> {
    return this.prisma.$transaction(async (tx: any) => {
      const versionesPrevias = await tx.workoutPlan.count({ where: { userId } });

      await tx.workoutPlan.updateMany({
        where: { userId, activo: true },
        data: { activo: false },
      });

      // Asegura que el catálogo de ejercicios exista (FK de WorkoutExercise).
      // Usa el catálogo efectivo (incluye ejercicios nuevos de BD) y, si falta
      // metadata, toma la embebida en el plan generado.
      const fuente = catalog && catalog.length ? catalog : DEFAULT_EXERCISES;
      const byId = new Map(fuente.map((e) => [e.id, e]));
      for (const dia of plan.dias) {
        for (const ej of dia.ejercicios) {
          const ex = byId.get(ej.exerciseId) ?? DEFAULT_EXERCISES.find((e) => e.id === ej.exerciseId);
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

      return this.toStoredPlan(creado as PrismaWorkoutPlanRow);
    });
  }

  async findAllVersionsByUser(userId: string): Promise<StoredPlan[]> {
    const rows = await this.prisma.workoutPlan.findMany({
      where: { userId },
      include: DIA_INCLUDE,
      orderBy: { version: 'asc' },
    });
    return (rows as PrismaWorkoutPlanRow[]).map((r) => this.toStoredPlan(r));
  }

  async substituteExercise(
    userId: string,
    workoutDayId: string,
    oldExerciseId: string,
    newExerciseId: string,
    motivo: string,
    catalog?: Exercise[],
  ): Promise<StoredPlan> {
    return this.prisma.$transaction(async (tx: any) => {
      // 1. Obtener el plan activo con sus días y ejercicios
      const plan = await tx.workoutPlan.findFirst({
        where: { userId, activo: true },
        include: DIA_INCLUDE,
      });
      if (!plan) {
        throw new NotFoundException('No active plan found for user');
      }

      // 2. Encontrar el día y el ejercicio a sustituir
      const dia = plan.dias.find((d: any) => d.id === workoutDayId);
      if (!dia) {
        throw new NotFoundException(`Workout day ${workoutDayId} not found in active plan`);
      }

      const ejercicioActual = dia.ejercicios.find((e: any) => e.exerciseId === oldExerciseId);
      if (!ejercicioActual) {
        throw new NotFoundException(`Exercise ${oldExerciseId} not found in workout day ${workoutDayId}`);
      }

      // 3. Obtener/asegurar el nuevo ejercicio del catálogo
      let nuevoEjercicio = await tx.exercise.findUnique({ where: { id: newExerciseId } });
      if (!nuevoEjercicio) {
        const fuente = catalog && catalog.length ? catalog : DEFAULT_EXERCISES;
        const ex = fuente.find((e) => e.id === newExerciseId);
        if (!ex) {
          throw new NotFoundException(`Replacement exercise ${newExerciseId} not found in catalog`);
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

      return this.toStoredPlan(planActualizado as PrismaWorkoutPlanRow);
    });
  }

  private toStoredPlan(row: PrismaWorkoutPlanRow): StoredPlan {
    return {
      id: row.id,
      userId: row.userId,
      version: row.version,
      activo: row.activo,
      plan: planRowToResult(row),
      createdAt: row.createdAt,
    };
  }
}
