import { Injectable } from '@nestjs/common';
import { WorkoutPlanResult } from '../../domain/types';
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

  async saveNewVersion(userId: string, plan: WorkoutPlanResult): Promise<StoredPlan> {
    return this.prisma.$transaction(async (tx: any) => {
      const versionesPrevias = await tx.workoutPlan.count({ where: { userId } });

      await tx.workoutPlan.updateMany({
        where: { userId, activo: true },
        data: { activo: false },
      });

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
