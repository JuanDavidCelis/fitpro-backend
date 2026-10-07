import { Body, Controller, Get, Inject, Module, Param, Post, UseGuards } from '@nestjs/common';
import { PersistenceModule } from '../../persistence/persistence.module';
import { USER_REPOSITORY } from '../../persistence/tokens';
import { UserRepositoryPort } from '../../persistence/ports/repositories';
import { UserApplicationService } from '../../application/UserApplicationService';
import { AuthModule } from '../../auth/auth.module';
import { FirebaseAuthGuard } from '../../auth/FirebaseAuthGuard';
import { CurrentUser } from '../../auth/CurrentUser.decorator';
import { VerifiedIdentity } from '../../auth/AuthTokenVerifierPort';

export const USER_APPLICATION_SERVICE = Symbol('USER_APPLICATION_SERVICE');

class RegisterUserBody {
  nombre!: string;
  // email ya no se acepta del body: se toma del token verificado, para que
  // no se pueda registrar una cuenta con un email que no es el propio.
}

@Controller('users')
class UsersController {
  constructor(
    @Inject(USER_APPLICATION_SERVICE) private readonly service: UserApplicationService,
  ) {}

  /**
   * Registro (documento de diseño, sección 9/31). Requiere estar autenticado
   * contra Firebase primero (el cliente ya tiene un ID token tras el sign-up
   * en el SDK de Firebase); aquí solo se crea el perfil de negocio asociado
   * a ese uid ya verificado, evitando que alguien registre un perfil con un
   * uid/email que no le pertenece.
   */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  async register(@CurrentUser() identity: VerifiedIdentity, @Body() body: RegisterUserBody) {
    return this.service.register({
      email: identity.email ?? `${identity.uid}@sin-email.fitpro`,
      nombre: body.nombre,
      firebaseUid: identity.uid,
    });
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
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
