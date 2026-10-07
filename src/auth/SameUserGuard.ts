import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../persistence/tokens';
import { UserRepositoryPort } from '../persistence/ports/repositories';

/**
 * Cierra el hueco real de seguridad: verificar que el usuario EXISTE no es
 * suficiente — cualquiera podía generar planes o registrar series a nombre
 * de cualquier userId. Este guard exige, además, que el usuario dueño del
 * :userId de la ruta sea el mismo que se autenticó.
 *
 * IMPORTANTE (decisión de diseño, corregida tras probar contra Postgres
 * real): el `id` interno de la base de datos es un UUID autogenerado,
 * DISTINTO del `firebaseUid` del token verificado — no se puede comparar
 * `req.user.uid` directamente contra `:userId`. Por eso este guard resuelve
 * primero, vía el repositorio, a qué usuario interno corresponde el
 * firebaseUid autenticado, y recién ahí compara contra la ruta.
 *
 * Debe aplicarse SIEMPRE después de FirebaseAuthGuard en la cadena de
 * guards, ya que depende de que `req.user` (con `.uid` = firebaseUid) ya
 * exista.
 */
@Injectable()
export class SameUserGuard implements CanActivate {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const routeUserId = request.params?.userId;
    const firebaseUid = request.user?.uid;

    if (!firebaseUid) {
      // Si esto ocurre es un error de configuración (guard usado sin
      // FirebaseAuthGuard antes), no un problema del usuario final.
      throw new ForbiddenException('No se pudo determinar la identidad autenticada');
    }

    const usuario = await this.userRepo.findByFirebaseUid(firebaseUid);
    if (!usuario || usuario.id !== routeUserId) {
      throw new ForbiddenException('No puedes operar sobre datos de otro usuario');
    }

    return true;
  }
}
