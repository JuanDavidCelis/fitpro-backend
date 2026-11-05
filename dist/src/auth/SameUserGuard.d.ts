import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Autorización: el usuario autenticado solo puede operar sobre SU propio
 * :userId. Como el id del usuario en nuestra base ES el uid de Supabase Auth
 * (claim `sub` del JWT verificado), la comparación es directa: no hace falta
 * consultar la base de datos en cada petición.
 *
 * Debe ir SIEMPRE después de SupabaseAuthGuard (depende de `req.user`).
 */
export declare class SameUserGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
