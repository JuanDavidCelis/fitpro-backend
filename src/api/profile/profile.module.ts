import { Body, Controller, Get, Inject, Module, Param, Put, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { USER_PROFILE_REPOSITORY } from '../../persistence/tokens';
import { UserProfileRepositoryPort } from '../../persistence/ports/repositories';
import { UserProfileApplicationService } from '../../application/UserProfileApplicationService';
import { UsersModule, USER_APPLICATION_SERVICE } from '../users/users.module';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';
import { UpdateProfileDto } from '../dto/profile.dto';

const USER_PROFILE_APPLICATION_SERVICE = Symbol('USER_PROFILE_APPLICATION_SERVICE');

@Controller('users/:userId/profile')
@UseGuards(SupabaseAuthGuard, SameUserGuard)
class ProfileController {
  constructor(
    @Inject(USER_PROFILE_APPLICATION_SERVICE) private readonly service: UserProfileApplicationService,
    @Inject(USER_APPLICATION_SERVICE) private readonly users: UserApplicationService,
  ) {}

  /**
   * Devuelve el perfil completo del usuario (o null si no lo ha completado).
   * El cliente usa esto para saber si debe mostrar el onboarding.
   */
  @Get()
  async getProfile(@Param('userId') userId: string) {
    await this.users.assertExists(userId);
    return this.service.getProfile(userId);
  }

  /**
   * Crea o actualiza (upsert) el perfil completo del usuario.
   * Idempotente: si el perfil no existe lo crea; si existe lo actualiza
   * con los campos provistos, manteniendo los no provistados.
   */
  @Put()
  async upsert(@Param('userId') userId: string, @Body() body: UpdateProfileDto) {
    await this.users.assertExists(userId);
    return this.service.upsertProfile(userId, body);
  }
}

@Module({
  imports: [PersistenceModule, UsersModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    {
      provide: USER_PROFILE_APPLICATION_SERVICE,
      useFactory: (profileRepo: UserProfileRepositoryPort) =>
        new UserProfileApplicationService(profileRepo),
      inject: [USER_PROFILE_REPOSITORY],
    },
  ],
  exports: [USER_PROFILE_APPLICATION_SERVICE],
})
export class ProfileModule {}