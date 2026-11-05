import { AuthTokenVerifierPort } from './AuthTokenVerifierPort';
/**
 * Elige el verificador de tokens:
 *  - Producción (Vercel / NODE_ENV=production): SIEMPRE Supabase. El login
 *    falso se ignora aunque alguien deje USE_FAKE_AUTH=true por error.
 *  - Desarrollo local: puede usarse el verificador falso (tokens "fake:uid:email").
 */
export declare function buildAuthVerifier(): AuthTokenVerifierPort;
export declare class AuthModule {
}
