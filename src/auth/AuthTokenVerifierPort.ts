// ============================================================================
// Puerto de autenticación (arquitectura hexagonal, mismo patrón que
// persistence/ports). El guard y el resto de la app dependen SOLO de esta
// interfaz, nunca directamente de firebase-admin. Esto permite testear el
// guard con un verificador falso, determinista, sin credenciales reales.
// ============================================================================

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
