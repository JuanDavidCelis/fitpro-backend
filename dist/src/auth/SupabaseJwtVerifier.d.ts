import { JWTVerifyGetKey } from 'jose';
import { AuthTokenVerifierPort, VerifiedIdentity } from './AuthTokenVerifierPort';
export interface SupabaseJwtVerifierOptions {
    /** URL del proyecto, p. ej. https://abcd1234.supabase.co */
    supabaseUrl: string;
    /**
     * Solo para proyectos con claves de firma LEGACY (HS256). Si tu proyecto
     * usa las claves asimétricas nuevas (lo normal hoy), déjalo sin definir.
     */
    jwtSecret?: string;
    /** Inyectable para tests (en producción se usa el JWKS remoto de Supabase). */
    jwks?: JWTVerifyGetKey;
    clockToleranceSeconds?: number;
}
/**
 * Verifica el access token (JWT) emitido por Supabase Auth:
 *  - firma (JWKS público del proyecto, o HS256 con el JWT secret legacy),
 *  - emisor  = <SUPABASE_URL>/auth/v1,
 *  - audiencia = "authenticated",
 *  - expiración.
 * Devuelve el uid (claim `sub`) y el email. Nunca confía en un claim sin
 * haber verificado antes la firma.
 */
export declare class SupabaseJwtVerifier implements AuthTokenVerifierPort {
    private readonly logger;
    private readonly issuer;
    private readonly jwks;
    private readonly secret?;
    private readonly clockTolerance;
    constructor(opts: SupabaseJwtVerifierOptions);
    verify(idToken: string): Promise<VerifiedIdentity>;
}
