import { Body, Controller, Get, Inject, Module, Param, Put, Query, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PROFILE_REPOSITORY } from '../../persistence/tokens';
import { ProfileRepositoryPort } from '../../persistence/ports/repositories';
import { PlanApplicationService } from '../../application/PlanApplicationService';
import { ProfileApplicationService } from '../../application/ProfileApplicationService';
import { UserApplicationService } from '../../application/UserApplicationService';
import { withMedia } from '../../application/media';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';
import { PlansModule, PLAN_APPLICATION_SERVICE } from '../plans/plans.module';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';
import { UserSettingsDto } from '../dto/user-settings.dto';

const PROFILE_APPLICATION_SERVICE = Symbol('PROFILE_APPLICATION_SERVICE');

@Controller('users/:userId/profile')
@UseGuards(SupabaseAuthGuard, SameUserGuard)
class ProfileController {
  constructor(
    @Inject(PROFILE_APPLICATION_SERVICE) private readonly service: ProfileApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
  ) {}

  @Get()
  async get(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    return this.service.getProfile(userId);
  }

  /**
   * Guarda todos los ajustes del usuario (datos, nivel, objetivo, días,
   * equipo, salud, peso objetivo). Si algo afecta a la rutina, devuelve la
   * rutina nueva en `plan`; si no, `plan` es null.
   */
  @Put()
  async put(
    @Param('userId') userId: string,
    @Body() body: UserSettingsDto,
    @Query('forzar') forzar?: string,
  ) {
    await this.users.assertExists(userId);
    const r = await this.service.saveProfile(userId, body, forzar === 'true');
    return { perfil: r.perfil, planRegenerado: r.planRegenerado, plan: r.plan ? withMedia(r.plan) : null };
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule, PlansModule],
  controllers: [ProfileController],
  providers: [
    {
      provide: PROFILE_APPLICATION_SERVICE,
      useFactory: (repo: ProfileRepositoryPort, plans: PlanApplicationService) =>
        new ProfileApplicationService(repo, plans),
      inject: [PROFILE_REPOSITORY, PLAN_APPLICATION_SERVICE],
    },
  ],
})
export class ProfileModule {}
