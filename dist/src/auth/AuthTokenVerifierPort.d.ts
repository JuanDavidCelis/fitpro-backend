export interface VerifiedIdentity {
    uid: string;
    email: string | null;
}
export interface AuthTokenVerifierPort {
    /**
     * Verifica un ID token y devuelve la identidad asociada.
     * Debe lanzar (no devolver null) si el token es inválido/expirado, para
     * que el guard lo traduzca a un 401 uniforme.
     */
    verify(idToken: string): Promise<VerifiedIdentity>;
}
