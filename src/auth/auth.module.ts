import { Logger, Module } from '@nestjs/common';
import { AUTH_TOKEN_VERIFIER } from './tokens';
import { AuthTokenVerifierPort } from './AuthTokenVerifierPort';
import { FakeAuthTokenVerifier } from './FakeAuthTokenVerifier';
import { SupabaseJwtVerifier } from './SupabaseJwtVerifier';
import { SupabaseAuthGuard } from './SupabaseAuthGuard';
import { SameUserGuard } from './SameUserGuard';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
}

function wantsFakeAuth(): boolean {
  const flag = process.env.USE_FAKE_AUTH;
  // Por comodidad en local, si no se define USE_FAKE_AUTH sigue a USE_IN_MEMORY_DB.
  return flag === 'true' || (flag === undefined && process.env.USE_IN_MEMORY_DB === 'true');
}

/**
 * Elige el verificador de tokens:
 *  - Producción (Vercel / NODE_ENV=production): SIEMPRE Supabase. El login
 *    falso se ignora aunque alguien deje USE_FAKE_AUTH=true por error.
 *  - Desarrollo local: puede usarse el verificador falso (tokens "fake:uid:email").
 */
export function buildAuthVerifier(): AuthTokenVerifierPort {
  const logger = new Logger('AuthModule');

  if (wantsFakeAuth()) {
    if (isProduction()) {
      logger.warn(
        'USE_FAKE_AUTH=true IGNORADO en producción: se usa Supabase Auth. ' +
          'Puedes borrar esa variable de entorno.',
      );
    } else {
      logger.warn('Auth FALSA activa (solo desarrollo local). No usar en producción.');
      return new FakeAuthTokenVerifier();
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'Falta la variable de entorno SUPABASE_URL (https://<project-ref>.supabase.co). ' +
        'Defínela en Vercel → Settings → Environment Variables.',
    );
  }
  return new SupabaseJwtVerifier({
    supabaseUrl,
    jwtSecret: process.env.SUPABASE_JWT_SECRET || undefined,
  });
}

@Module({
  providers: [
    { provide: AUTH_TOKEN_VERIFIER, useFactory: buildAuthVerifier },
    SupabaseAuthGuard,
    SameUserGuard,
  ],
  exports: [AUTH_TOKEN_VERIFIER, SupabaseAuthGuard, SameUserGuard],
})
export class AuthModule {}
