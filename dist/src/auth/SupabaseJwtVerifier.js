"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseJwtVerifier = void 0;
const common_1 = require("@nestjs/common");
const jose_1 = require("jose");
// Lista blanca de algoritmos: evita ataques de "confusión de algoritmo" y
// el clásico alg=none. HS256 solo se acepta si hay secreto configurado.
const ASYMMETRIC_ALGS = ['RS256', 'ES256', 'EdDSA'];
/**
 * Verifica el access token (JWT) emitido por Supabase Auth:
 *  - firma (JWKS público del proyecto, o HS256 con el JWT secret legacy),
 *  - emisor  = <SUPABASE_URL>/auth/v1,
 *  - audiencia = "authenticated",
 *  - expiración.
 * Devuelve el uid (claim `sub`) y el email. Nunca confía en un claim sin
 * haber verificado antes la firma.
 */
class SupabaseJwtVerifier {
    constructor(opts) {
        this.logger = new common_1.Logger(SupabaseJwtVerifier.name);
        const base = (opts.supabaseUrl ?? '').trim().replace(/\/+$/, '');
        if (!/^https?:\/\/.+/.test(base)) {
            throw new Error('SUPABASE_URL inválida o ausente. Debe verse así: https://<tu-project-ref>.supabase.co');
        }
        this.issuer = `${base}/auth/v1`;
        this.jwks =
            opts.jwks ??
                (0, jose_1.createRemoteJWKSet)(new URL(`${this.issuer}/.well-known/jwks.json`), {
                    timeoutDuration: 5000,
                });
        this.secret = opts.jwtSecret ? new TextEncoder().encode(opts.jwtSecret) : undefined;
        this.clockTolerance = opts.clockToleranceSeconds ?? 5;
    }
    async verify(idToken) {
        const invalid = () => new common_1.UnauthorizedException('Token de autenticación inválido o expirado');
        if (!idToken || idToken.length > 8192)
            throw invalid();
        let alg;
        try {
            alg = (0, jose_1.decodeProtectedHeader)(idToken).alg;
        }
        catch {
            throw invalid();
        }
        try {
            const common = {
                issuer: this.issuer,
                audience: 'authenticated',
                clockTolerance: this.clockTolerance,
            };
            let payload;
            if (alg === 'HS256') {
                if (!this.secret) {
                    this.logger.error('Llegó un token HS256 pero SUPABASE_JWT_SECRET no está configurado. ' +
                        'Tu proyecto usa claves legacy: copia el JWT Secret desde Supabase → Settings → JWT Keys.');
                    throw invalid();
                }
                ({ payload } = await (0, jose_1.jwtVerify)(idToken, this.secret, { ...common, algorithms: ['HS256'] }));
            }
            else {
                ({ payload } = await (0, jose_1.jwtVerify)(idToken, this.jwks, { ...common, algorithms: ASYMMETRIC_ALGS }));
            }
            const sub = payload.sub;
            if (typeof sub !== 'string' || sub.length === 0)
                throw invalid();
            // Las sesiones anónimas de Supabase también traen role=authenticated;
            // esta app exige una cuenta real con correo.
            if (payload['is_anonymous'] === true)
                throw invalid();
            if (payload['role'] !== undefined && payload['role'] !== 'authenticated')
                throw invalid();
            const rawEmail = payload['email'];
            const email = typeof rawEmail === 'string' && rawEmail.length > 0 ? rawEmail : null;
            return { uid: sub, email };
        }
        catch (e) {
            if (e instanceof common_1.UnauthorizedException)
                throw e;
            // Solo el nombre del error (JWTExpired, JWSSignatureVerificationFailed...),
            // nunca el token, para poder depurar sin filtrar credenciales.
            this.logger.warn(`JWT rechazado: ${e?.name ?? 'error desconocido'}`);
            throw invalid();
        }
    }
}
exports.SupabaseJwtVerifier = SupabaseJwtVerifier;
