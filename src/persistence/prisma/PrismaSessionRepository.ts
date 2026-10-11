import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionLog } from '../../engine/adaptationEngine';
import {
  FinishSessionInput,
  LogSetInput,
  SessionRepositoryPort,
  SessionSummary,
  StartSessionInput,
  StoredExerciseSet,
  StoredSession,
} from '../ports/repositories';
import { PrismaService } from './PrismaService';

/**
 * ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts).
 *
 * Restricción real del esquema relacional: `ExerciseSet` cuelga de
 * `WorkoutExercise` (la instancia planificada de un ejercicio dentro de un
 * día concreto), no directamente de `Exercise`. Por eso registrar una serie
 * requiere que ya exista una `WorkoutSession` — de ahí que startSession()
 * sea un paso obligatorio antes de logSet().
 */
@Injectable()
export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // Ver la misma constante y justificación en InMemorySessionRepository:
  // límite de retención para no agotar el plan gratuito de Supabase. El
  // historial completo sin límite vive solo en el dispositivo (Room).
  private static readonly RETENCION_SESIONES_POR_EJERCICIO = 8;

  async startSession(input: StartSessionInput): Promise<StoredSession> {
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
      estado: created.estado as StoredSession['estado'],
    };
  }

  async logSet(input: LogSetInput): Promise<StoredExerciseSet> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: input.sessionId },
      include: { workoutDay: { include: { ejercicios: true } } },
    });
    if (!session || session.userId !== input.userId) {
      throw new NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
    }

    const workoutExercise = session.workoutDay.ejercicios.find(
      (we: any) => we.exerciseId === input.exerciseId,
    );
    if (!workoutExercise) {
      throw new NotFoundException(
        `El ejercicio ${input.exerciseId} no pertenece al día planificado de esta sesión`,
      );
    }

    const created = await this.prisma.exerciseSet.create({
      data: {
        sessionId: input.sessionId,
        workoutExerciseId: workoutExercise.id,
        numeroSerie: input.numeroSerie,
        pesoKg: input.pesoKg,
        repsRealizadas: input.repsRealizadas,
        rirReportado: input.rirReportado,
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

  async finishSession(input: FinishSessionInput): Promise<SessionSummary> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id: input.sessionId },
      include: { sets: true },
    });
    if (!session || session.userId !== input.userId) {
      throw new NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
    }

    const sets = session.sets as any[];
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

    const exerciseIdsDeEstaSesion = new Set(sets.map((s: any) => s.workoutExercise?.exerciseId).filter(Boolean));
    await this.pruneOldSetsForExercises(input.userId, exerciseIdsDeEstaSesion as Set<string>);

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
  private async pruneOldSetsForExercises(userId: string, exerciseIds: Set<string>): Promise<void> {
    for (const exerciseId of exerciseIds) {
      const sesionesConEsteEjercicio = await this.prisma.workoutSession.findMany({
        where: { userId, workoutDay: { ejercicios: { some: { exerciseId } } } },
        orderBy: { fecha: 'desc' },
        select: { id: true },
      });

      const idsAConservar = new Set(
        sesionesConEsteEjercicio
          .slice(0, PrismaSessionRepository.RETENCION_SESIONES_POR_EJERCICIO)
          .map((s: any) => s.id),
      );
      const idsAPodar = sesionesConEsteEjercicio
        .map((s: any) => s.id)
        .filter((id: string) => !idsAConservar.has(id));

      if (idsAPodar.length === 0) continue;

      await this.prisma.exerciseSet.deleteMany({
        where: {
          sessionId: { in: idsAPodar },
          workoutExercise: { exerciseId },
        },
      });
    }
  }

  async findRecentSessionLogs(
    userId: string,
    exerciseId: string,
    limitSesiones: number,
  ): Promise<SessionLog[]> {
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

    const logs: SessionLog[] = sessions
      .map((s: any) => {
        const setsDelEjercicio = s.sets.filter(
          (set: any) => set.workoutExercise.exerciseId === exerciseId,
        );
        if (setsDelEjercicio.length === 0) return null;
        return {
          fecha: s.fecha.toISOString(),
          repsObjetivoMax: setsDelEjercicio[0].workoutExercise.repsMax,
          sets: setsDelEjercicio
            .sort((a: any, b: any) => a.numeroSerie - b.numeroSerie)
            .map((set: any) => ({
              pesoKg: set.pesoKg,
              repsRealizadas: set.repsRealizadas,
              rirReportado: set.rirReportado ?? 2,
            })),
        };
      })
      .filter((l: SessionLog | null): l is SessionLog => l !== null)
      .reverse();

    return logs;
  }
}
