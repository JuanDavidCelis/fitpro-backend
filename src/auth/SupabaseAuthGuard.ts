import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_TOKEN_VERIFIER } from './tokens';
import { AuthTokenVerifierPort, VerifiedIdentity } from './AuthTokenVerifierPort';

/**
 * Responde "¿quién eres, de verdad?": extrae `Authorization: Bearer <jwt>`,
 * lo verifica contra el puerto inyectado (Supabase en producción) y adjunta
 * la identidad verificada como `req.user`. La autorización (¿puedes tocar
 * ESTE recurso?) la decide SameUserGuard.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_VERIFIER) private readonly verifier: AuthTokenVerifierPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el header Authorization: Bearer <token>');
    }

    const token = header.slice('Bearer '.length).trim();
    const identity: VerifiedIdentity = await this.verifier.verify(token);
    request.user = identity;
    return true;
  }
}
