import { Body, Controller, Get, Inject, Module, Param, Post, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PROGRESS_REPOSITORY, USER_PROFILE_REPOSITORY } from '../../persistence/tokens';
import { ProgressRepositoryPort, UserProfileRepositoryPort } from '../../persistence/ports/repositories';
import { ProgressApplicationService } from '../../application/ProgressApplicationService';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';
import { RegisterWeightDto } from '../dto/profile.dto';

const PROGRESS_APPLICATION_SERVICE = Symbol('PROGRESS_APPLICATION_SERVICE');

@Controller('users/:userId/progress')
@UseGuards(SupabaseAuthGuard, SameUserGuard)
class ProgressController {
  constructor(
    @Inject(PROGRESS_APPLICATION_SERVICE) private readonly service: ProgressApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
    @Inject(USER_PROFILE_REPOSITORY) private readonly profileRepo: UserProfileRepositoryPort,
  ) {}

  /**
   * Devuelve el historial de progreso de peso + cálculo de progreso hacia objetivo.
   * Necesita el peso objetivo del perfil del usuario (si lo tiene).
   */
  @Get()
  async getProgress(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    const profile = await this.profileRepo.findByUserId(userId);
    const targetWeightKg = profile?.pesoObjetivoKg ?? null;
    return this.service.getProgress(userId, targetWeightKg);
  }

  /** Registra el peso actual del usuario (manual o automático). */
  @Post('weight')
  async registerWeight(@Param('userId') userId: string, @Body() body: RegisterWeightDto) {
    await this.users.assertExists(userId);
    return this.service.registerWeight(userId, body.pesoKg, body.fuente);
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule],
  controllers: [ProgressController],
  providers: [
    {
      provide: PROGRESS_APPLICATION_SERVICE,
      useFactory: (progressRepo: ProgressRepositoryPort) =>
        new ProgressApplicationService(progressRepo),
      inject: [PROGRESS_REPOSITORY],
    },
  ],
  exports: [PROGRESS_APPLICATION_SERVICE],
})
export class ProgressModule {}