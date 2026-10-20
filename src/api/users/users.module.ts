import { Body, Controller, Get, Inject, Module, Param, Post, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { USER_REPOSITORY } from '../../persistence/tokens';
import { UserRepositoryPort } from '../../persistence/ports/repositories';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';
import { SameUserGuard } from '../../auth/SameUserGuard';
import { CurrentUser } from '../../auth/CurrentUser.decorator';
import { VerifiedIdentity } from '../../auth/AuthTokenVerifierPort';

export const USER_APPLICATION_SERVICE = Symbol('USER_APPLICATION_SERVICE');

class RegisterUserBody {
  // El email y el id NO se aceptan del body: salen del token ya verificado,
  // para que nadie pueda registrar un perfil a nombre de otra cuenta.
  nombre?: string;
}

@Controller('users')
class UsersController {
  constructor(
    @Inject(USER_APPLICATION_SERVICE) private readonly service: UserApplicationService,
  ) {}

  /**
   * Crea el perfil de negocio de la cuenta que acaba de iniciar sesión en
   * Supabase Auth (o devuelve el existente). Idempotente.
   */
  @Post()
  @UseGuards(SupabaseAuthGuard)
  async register(@CurrentUser() identity: VerifiedIdentity, @Body() body: RegisterUserBody) {
    return this.service.registerOrGet({
      id: identity.uid,
      email: identity.email ?? `${identity.uid}@sin-email.fitpro`,
      nombre: body?.nombre,
    });
  }

  @Get(':userId')
  @UseGuards(SupabaseAuthGuard, SameUserGuard)
  async getById(@Param('userId') userId: string) {
    return this.service.getById(userId);
  }
}

@Module({
  imports: [PersistenceModule, AuthModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_APPLICATION_SERVICE,
      useFactory: (userRepo: UserRepositoryPort) => new UserApplicationService(userRepo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [USER_APPLICATION_SERVICE],
})
export class UsersModule {}
