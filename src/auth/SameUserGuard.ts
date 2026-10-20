import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Autorización: el usuario autenticado solo puede operar sobre SU propio
 * :userId. Como el id del usuario en nuestra base ES el uid de Supabase Auth
 * (claim `sub` del JWT verificado), la comparación es directa: no hace falta
 * consultar la base de datos en cada petición.
 *
 * Debe ir SIEMPRE después de SupabaseAuthGuard (depende de `req.user`).
 */
@Injectable()
export class SameUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const routeUserId: string | undefined = request.params?.userId;
    const authenticatedUid: string | undefined = request.user?.uid;

    if (!authenticatedUid) {
      // Error de configuración (guard usado sin SupabaseAuthGuard antes).
      throw new ForbiddenException('No se pudo determinar la identidad autenticada');
    }
    if (!routeUserId || routeUserId !== authenticatedUid) {
      throw new ForbiddenException('No puedes operar sobre datos de otro usuario');
    }
    return true;
  }
}
