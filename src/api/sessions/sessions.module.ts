import { Body, Controller, Get, Inject, Module, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PLAN_REPOSITORY, RECOVERY_REPOSITORY, SESSION_REPOSITORY } from '../../persistence/tokens';
import { PlanRepositoryPort, RecoveryRepositoryPort, SessionRepositoryPort } from '../../persistence/ports/repositories';
import { SessionApplicationService } from '../../application/SessionApplicationService';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { FirebaseAuthGuard } from '../../auth/FirebaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';

const SESSION_APPLICATION_SERVICE = Symbol('SESSION_APPLICATION_SERVICE');

class StartSessionBody {
  diaOrden!: number;
}

class LogSetBody {
  sessionId!: string;
  exerciseId!: string;
  numeroSerie!: number;
  pesoKg!: number;
  repsRealizadas!: number;
  rirReportado!: number | null;
  repsObjetivoMax!: number;
}

class FinishSessionBody {
  duracionRealSeg!: number;
  fatigaPercibida?: number | null;
  estado?: 'completada' | 'parcial';
}

@Controller('users/:userId/sessions')
@UseGuards(FirebaseAuthGuard, SameUserGuard)
class SessionsController {
  constructor(
    @Inject(SESSION_APPLICATION_SERVICE) private readonly service: SessionApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
  ) {}

  /**
   * Botón "INICIAR ENTRENAMIENTO" (sección 13). Crea la sesión sobre el día
   * indicado del plan ACTIVO del usuario y devuelve el sessionId a usar en
   * las siguientes llamadas de esta pantalla.
   */
  @Post()
  async start(@Param('userId') userId: string, @Body() body: StartSessionBody) {
    await this.users.assertExists(userId);
    return this.service.startSession(userId, body.diaOrden);
  }

  @Post('sets')
  async logSet(@Param('userId') userId: string, @Body() body: LogSetBody) {
    await this.users.assertExists(userId);
    return this.service.logSet({ userId, ...body });
  }

  /**
   * Cierra la sesión y calcula las estadísticas finales (peso total
   * levantado, series, repeticiones, duración) a partir de lo realmente
   * persistido — nunca confiando en un total que el cliente calcule solo.
   */
  @Post(':sessionId/finish')
  async finish(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: FinishSessionBody,
  ) {
    await this.users.assertExists(userId);
    return this.service.finishSession({ sessionId, userId, ...body });
  }

  @Get('adaptation')
  async getAdaptation(
    @Param('userId') userId: string,
    @Query('exerciseId') exerciseId: string,
  ) {
    await this.users.assertExists(userId);
    return this.service.decideAdaptationForExercise(userId, exerciseId);
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule],
  controllers: [SessionsController],
  providers: [
    {
      provide: SESSION_APPLICATION_SERVICE,
      useFactory: (
        sessionRepo: SessionRepositoryPort,
        recoveryRepo: RecoveryRepositoryPort,
        planRepo: PlanRepositoryPort,
      ) => new SessionApplicationService(sessionRepo, recoveryRepo, planRepo),
      inject: [SESSION_REPOSITORY, RECOVERY_REPOSITORY, PLAN_REPOSITORY],
    },
  ],
})
export class SessionsModule {}
