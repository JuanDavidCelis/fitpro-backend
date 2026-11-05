import { AuthTokenVerifierPort, VerifiedIdentity } from './AuthTokenVerifierPort';
/**
 * Verificador determinista para desarrollo local y tests, activado con
 * USE_IN_MEMORY_DB=true (mismo flag que ya controla memoria vs Prisma, para
 * mantener un único "modo demo" coherente en todo el backend).
 *
 * Convención del token falso: "fake:<uid>:<email>". Esto NO es seguro y
 * jamás debe activarse en producción; solo existe para poder probar el
 * comportamiento real del guard (401/403) sin depender de un proyecto
 * Supabase Auth real.
 */
export declare class FakeAuthTokenVerifier implements AuthTokenVerifierPort {
    verify(idToken: string): Promise<VerifiedIdentity>;
}
