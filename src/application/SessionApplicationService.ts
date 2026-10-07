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
