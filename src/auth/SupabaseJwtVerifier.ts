import { Logger, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, JWTPayload, JWTVerifyGetKey } from 'jose';
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
export class SupabaseJwtVerifier implements AuthTokenVerifierPort {
  private readonly logger = new Logger(SupabaseJwtVerifier.name);
  private readonly issuer: string;
  private readonly jwks: JWTVerifyGetKey;
  private readonly secret?: Uint8Array;
  private readonly clockTolerance: number;

  constructor(opts: SupabaseJwtVerifierOptions) {
    const base = (opts.supabaseUrl ?? '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/.test(base)) {
      throw new Error(
        'SUPABASE_URL inválida o ausente. Debe verse así: https://<tu-project-ref>.supabase.co',
      );
    }
    this.issuer = `${base}/auth/v1`;
    this.jwks =
      opts.jwks ??
      createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`), {
        timeoutDuration: 5000,
      });
    this.secret = opts.jwtSecret ? new TextEncoder().encode(opts.jwtSecret) : undefined;
    this.clockTolerance = opts.clockToleranceSeconds ?? 5;
  }

  async verify(idToken: string): Promise<VerifiedIdentity> {
    const invalid = () => new UnauthorizedException('Token de autenticación inválido o expirado');

    if (!idToken || idToken.length > 8192) throw invalid();

    let alg: string | undefined;
    try {
      alg = decodeProtectedHeader(idToken).alg;
    } catch {
      throw invalid();
    }

    try {
      const common = {
        issuer: this.issuer,
        audience: 'authenticated',
        clockTolerance: this.clockTolerance,
      };

      let payload: JWTPayload;
      if (alg === 'HS256') {
        if (!this.secret) {
          this.logger.error(
            'Llegó un token HS256 pero SUPABASE_JWT_SECRET no está configurado. ' +
              'Tu proyecto usa claves legacy: copia el JWT Secret desde Supabase → Settings → JWT Keys.',
          );
          throw invalid();
        }
        ({ payload } = await jwtVerify(idToken, this.secret, { ...common, algorithms: ['HS256'] }));
      } else {
        ({ payload } = await jwtVerify(idToken, this.jwks, { ...common, algorithms: ASYMMETRIC_ALGS }));
      }

      const sub = payload.sub;
      if (typeof sub !== 'string' || sub.length === 0) throw invalid();
      // Las sesiones anónimas de Supabase también traen role=authenticated;
      // esta app exige una cuenta real con correo.
      if (payload['is_anonymous'] === true) throw invalid();
      if (payload['role'] !== undefined && payload['role'] !== 'authenticated') throw invalid();

      const rawEmail = payload['email'];
      const email = typeof rawEmail === 'string' && rawEmail.length > 0 ? rawEmail : null;
      return { uid: sub, email };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      // Solo el nombre del error (JWTExpired, JWSSignatureVerificationFailed...),
      // nunca el token, para poder depurar sin filtrar credenciales.
      this.logger.warn(`JWT rechazado: ${(e as Error)?.name ?? 'error desconocido'}`);
      throw invalid();
    }
  }
}
