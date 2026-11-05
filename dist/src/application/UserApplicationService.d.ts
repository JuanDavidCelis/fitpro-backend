import { StoredUser, UserRepositoryPort } from '../persistence/ports/repositories';
export interface RegisterOrGetInput {
    /** uid de Supabase Auth (claim sub ya verificado). */
    id: string;
    email: string;
    nombre?: unknown;
}
export declare class UserApplicationService {
    private readonly userRepo;
    constructor(userRepo: UserRepositoryPort);
    /**
     * Crea el perfil de negocio del usuario autenticado, o devuelve el que ya
     * existe. Es idempotente a propósito: iniciar sesión en un teléfono nuevo
     * llama al mismo endpoint sin duplicar ni fallar.
     */
    registerOrGet(input: RegisterOrGetInput): Promise<StoredUser>;
    getById(id: string): Promise<StoredUser>;
    /**
     * Usado por otros módulos (plans, sessions): un usuario puede estar
     * autenticado en Supabase pero no haber creado aún su perfil aquí.
     */
    assertExists(id: string): Promise<void>;
    private normalizarNombre;
    private nombrePorDefecto;
}
