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
 * Extrae el header `Authorization: Bearer <token>`, lo verifica contra el
 * puerto inyectado (real: Firebase; dev/tests: fake) y adjunta la identidad
 * verificada como `req.user`. No decide autorización (eso lo hace cada
 * controller comparando req.user.uid contra el :userId de la ruta); este
 * guard solo responde la pregunta "¿quién eres, de verdad?".
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
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
