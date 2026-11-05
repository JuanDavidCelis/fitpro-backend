import { Body, Controller, Get, Inject, Module, Param, Post, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PROFILE_REPOSITORY, PROGRESS_REPOSITORY } from '../../persistence/tokens';
import { ProfileRepositoryPort, ProgressRepositoryPort } from '../../persistence/ports/repositories';
import { ProgressApplicationService } from '../../application/ProgressApplicationService';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';

const PROGRESS_APPLICATION_SERVICE = Symbol('PROGRESS_APPLICATION_SERVICE');

@Controller('users/:userId/progress')
@UseGuards(SupabaseAuthGuard, SameUserGuard)
class ProgressController {
  constructor(
    @Inject(PROGRESS_APPLICATION_SERVICE) private readonly service: ProgressApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
  ) {}

  /** Historial de peso (para el gráfico) + peso objetivo del perfil. */
  @Get('weight')
  async history(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    return this.service.getHistory(userId);
  }

  @Post('weight')
  async add(@Param('userId') userId: string, @Body() body: unknown) {
    await this.users.assertExists(userId);
    return this.service.addWeight(userId, body);
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule],
  controllers: [ProgressController],
  providers: [
    {
      provide: PROGRESS_APPLICATION_SERVICE,
      useFactory: (progress: ProgressRepositoryPort, profile: ProfileRepositoryPort) =>
        new ProgressApplicationService(progress, profile),
      inject: [PROGRESS_REPOSITORY, PROFILE_REPOSITORY],
    },
  ],
})
export class ProgressModule {}
