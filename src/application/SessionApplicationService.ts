import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdaptationAction, decideAdaptation } from '../engine/adaptationEngine';
import {
  FinishSessionInput,
  LogSetInput,
  PlanRepositoryPort,
  RecoveryRepositoryPort,
  SessionRepositoryPort,
  SessionSummary,
  StoredSession,
} from '../persistence/ports/repositories';

export interface NextSession {
  diaOrden: number;
  ultimoDiaOrden: number | null;
  ultimaFecha: string | null;
}

/**
 * Orquesta el ciclo de vida de una sesión de entrenamiento:
 *   iniciar (botón "INICIAR ENTRENAMIENTO") -> registrar series -> finalizar
 *   (calcula estadísticas: peso total, series, tiempo).
 * decideAdaptation() en sí es puro y ya está cubierto por tests; aquí solo
 * se valida el ensamblado de datos reales.
 */
export class SessionApplicationService {
  constructor(
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly recoveryRepo: RecoveryRepositoryPort,
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  /**
   * Inicia una sesión sobre el día `diaOrden` del plan ACTIVO del usuario.
   * No acepta un workoutDayId arbitrario del cliente: se resuelve siempre
   * contra el plan activo real, para que no se puedan registrar series
   * contra un día que no pertenece a la versión vigente del plan.
   */
  async startSession(userId: string, diaOrden: number): Promise<StoredSession> {
    const planActivo = await this.planRepo.findActiveByUser(userId);
    if (!planActivo) {
      throw new NotFoundException('No tienes un plan activo. Genera uno primero.');
    }

    const dia = planActivo.plan.dias.find((d) => d.orden === diaOrden);
    if (!dia) {
      throw new NotFoundException(`El día ${diaOrden} no existe en tu plan activo.`);
    }
    if (!dia.id) {
      // No debería ocurrir nunca en un plan ya persistido; si pasa, es un
      // bug de mapeo (Prisma/memoria) y hay que fallar fuerte, no adivinar.
      throw new BadRequestException('El día del plan no tiene un identificador persistido válido.');
    }

    return this.sessionRepo.startSession({ userId, workoutDayId: dia.id });
  }

  /**
   * Próxima sesión del plan ACTIVO: el día siguiente al de la última sesión
   * completada (y vuelve al día 1 después del último). Ignora las sesiones
   * de versiones anteriores del plan: si regeneras la rutina, empiezas en el día 1.
   */
  async getNextSession(userId: string): Promise<NextSession> {
    const plan = await this.planRepo.findActiveByUser(userId);
    if (!plan || plan.plan.dias.length === 0) {
      throw new NotFoundException('No tienes un plan activo. Genera uno primero.');
    }
    const dias = [...plan.plan.dias].sort((a, b) => a.orden - b.orden);
    const ids = dias.map((d) => d.id).filter((id): id is string => !!id);

    const ultima = await this.sessionRepo.findLastCompletedSession(userId, ids);
    const idx = ultima ? dias.findIndex((d) => d.id === ultima.workoutDayId) : -1;
    if (!ultima || idx < 0) {
      return { diaOrden: dias[0].orden, ultimoDiaOrden: null, ultimaFecha: null };
    }
    return {
      diaOrden: dias[(idx + 1) % dias.length].orden,
      ultimoDiaOrden: dias[idx].orden,
      ultimaFecha: ultima.fecha.toISOString(),
    };
  }

  async logSet(input: LogSetInput) {
    return this.sessionRepo.logSet(input);
  }

  async finishSession(input: FinishSessionInput): Promise<SessionSummary> {
    return this.sessionRepo.finishSession(input);
  }

  async decideAdaptationForExercise(
    userId: string,
    exerciseId: string,
    limitSesiones = 3,
  ): Promise<AdaptationAction> {
    const historial = await this.sessionRepo.findRecentSessionLogs(userId, exerciseId, limitSesiones);
    const recoveryPromedio = await this.recoveryRepo.averageRecentRecoveryScore(userId, 7);
    return decideAdaptation(historial, recoveryPromedio);
  }
}
