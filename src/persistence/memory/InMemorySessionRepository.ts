import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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

@Injectable()
export class InMemorySessionRepository implements SessionRepositoryPort {
  private sessions: StoredSession[] = [];
  private sets: StoredExerciseSet[] = [];

  // DECISIÓN DE ARQUITECTURA (ver documentación de datos): con un plan
  // gratuito de Supabase, la nube NO debe acumular historial ilimitado.
  // El motor de adaptación solo necesita las últimas 2-3 sesiones por
  // ejercicio; se conserva un margen (8) y se descarta el resto. El
  // historial completo, sin límite, vive únicamente en el dispositivo
  // (Room, en la app Android) y se pierde si el usuario desinstala — es un
  // trade-off aceptado para mantener el costo de infraestructura en cero.
  private static readonly RETENCION_SESIONES_POR_EJERCICIO = 8;

  async startSession(input: StartSessionInput): Promise<StoredSession> {
    const nueva: StoredSession = {
      id: randomUUID(),
      userId: input.userId,
      workoutDayId: input.workoutDayId,
      fecha: new Date(),
      estado: 'en_progreso',
    };
    this.sessions.push(nueva);
    return nueva;
  }

  async logSet(input: LogSetInput): Promise<StoredExerciseSet> {
    const session = this.sessions.find((s) => s.id === input.sessionId && s.userId === input.userId);
    if (!session) {
      throw new NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
    }

    const nuevo: StoredExerciseSet = {
      id: randomUUID(),
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

  async finishSession(input: FinishSessionInput): Promise<SessionSummary> {
    const session = this.sessions.find((s) => s.id === input.sessionId && s.userId === input.userId);
    if (!session) {
      throw new NotFoundException(`Sesión ${input.sessionId} no existe para este usuario`);
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
  private pruneOldSetsForExercises(userId: string, exerciseIds: Set<string>): void {
    for (const exerciseId of exerciseIds) {
      const sessionIdsConFecha = [
        ...new Set(
          this.sets
            .filter((s) => s.userId === userId && s.exerciseId === exerciseId)
            .map((s) => s.sessionId),
        ),
      ].map((sessionId) => ({
        sessionId,
        fecha: this.sessions.find((se) => se.id === sessionId)?.fecha ?? new Date(0),
      }));

      sessionIdsConFecha.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      const sesionesAConservar = new Set(
        sessionIdsConFecha
          .slice(0, InMemorySessionRepository.RETENCION_SESIONES_POR_EJERCICIO)
          .map((s) => s.sessionId),
      );

      this.sets = this.sets.filter(
        (s) =>
          !(s.userId === userId && s.exerciseId === exerciseId) || sesionesAConservar.has(s.sessionId),
      );
    }
  }

  async findRecentSessionLogs(
    userId: string,
    exerciseId: string,
    limitSesiones: number,
  ): Promise<SessionLog[]> {
    const propios = this.sets.filter((s) => s.userId === userId && s.exerciseId === exerciseId);

    // Agrupar por sessionId (cada sesión = 1 entrenamiento con N series).
    const porSesion = new Map<string, StoredExerciseSet[]>();
    for (const s of propios) {
      const lista = porSesion.get(s.sessionId) ?? [];
      lista.push(s);
      porSesion.set(s.sessionId, lista);
    }

    const sesiones: SessionLog[] = Array.from(porSesion.entries()).map(([, sets]) => ({
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
}
