import { UserSettings } from '../domain/types';
import { ProfileRepositoryPort, StoredPlan } from '../persistence/ports/repositories';
import { PlanApplicationService } from './PlanApplicationService';
export interface SaveProfileResult {
    perfil: UserSettings;
    planRegenerado: boolean;
    plan: StoredPlan | null;
}
export declare class ProfileApplicationService {
    private readonly profileRepo;
    private readonly planService;
    constructor(profileRepo: ProfileRepositoryPort, planService: PlanApplicationService);
    getProfile(userId: string): Promise<UserSettings>;
    /**
     * Guarda TODOS los ajustes del usuario y, si cambió algo que afecta a la
     * rutina (nivel, objetivo, días, minutos, equipo, salud, músculos
     * prioritarios), o si todavía no tiene rutina, genera una nueva versión de
     * forma automática. Cambiar solo el peso objetivo no toca la rutina.
     */
    saveProfile(userId: string, body: unknown, forzar?: boolean): Promise<SaveProfileResult>;
}
