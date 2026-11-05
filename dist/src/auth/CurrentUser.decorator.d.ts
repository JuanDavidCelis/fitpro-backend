/**
 * Uso: async miEndpoint(@CurrentUser() user: VerifiedIdentity) { ... }
 * Requiere que Supabase AuthAuthGuard ya haya corrido antes en la cadena de
 * guards (adjunta req.user).
 */
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
