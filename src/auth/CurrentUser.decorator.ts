import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VerifiedIdentity } from './AuthTokenVerifierPort';

/**
 * Uso: async miEndpoint(@CurrentUser() user: VerifiedIdentity) { ... }
 * Requiere que Supabase AuthAuthGuard ya haya corrido antes en la cadena de
 * guards (adjunta req.user).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): VerifiedIdentity => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
