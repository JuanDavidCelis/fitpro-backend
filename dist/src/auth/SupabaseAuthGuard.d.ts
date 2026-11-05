import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthTokenVerifierPort } from './AuthTokenVerifierPort';
/**
 * Responde "¿quién eres, de verdad?": extrae `Authorization: Bearer <jwt>`,
 * lo verifica contra el puerto inyectado (Supabase en producción) y adjunta
 * la identidad verificada como `req.user`. La autorización (¿puedes tocar
 * ESTE recurso?) la decide SameUserGuard.
 */
export declare class SupabaseAuthGuard implements CanActivate {
    private readonly verifier;
    constructor(verifier: AuthTokenVerifierPort);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
