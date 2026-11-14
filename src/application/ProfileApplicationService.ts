import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserSettings } from '../domain/types';
import { trainingFieldsChanged, validateUserSettings } from '../domain/settings';
import { ProfileRepositoryPort, StoredPlan } from '../persistence/ports/repositories';
import { PlanApplicationService } from './PlanApplicationService';

export interface SaveProfileResult {
  perfil: UserSettings;
  planRegenerado: boolean;
  plan: StoredPlan | null;
}

export class ProfileApplicationService {
  constructor(
    private readonly profileRepo: ProfileRepositoryPort,
    private readonly planService: PlanApplicationService,
  ) {}

  async getProfile(userId: string): Promise<UserSettings> {
    const p = await this.profileRepo.findByUser(userId);
    if (!p) throw new NotFoundException({ message: 'Aún no has completado tu perfil.', code: 'PROFILE_NOT_FOUND' });
    return p;
  }

  /**
   * Guarda TODOS los ajustes del usuario y, si cambió algo que afecta a la
   * rutina (nivel, objetivo, días, minutos, equipo, salud, músculos
   * prioritarios), o si todavía no tiene rutina, genera una nueva versión de
   * forma automática. Cambiar solo el peso objetivo no toca la rutina.
   */
  async saveProfile(userId: string, body: unknown, forzar = false): Promise<SaveProfileResult> {
    const v = validateUserSettings(body);
    if (!v.ok) throw new BadRequestException({ message: 'Datos de perfil inválidos', errores: v.errores });

    const previo = await this.profileRepo.findByUser(userId);
    const guardado = await this.profileRepo.save(userId, v.value);
    const planActivo = await this.planService.getActivePlan(userId);

    const regenerar = forzar || !planActivo || !previo || trainingFieldsChanged(previo, guardado);
    const plan = regenerar ? await this.planService.generateFromSettings(userId, guardado) : null;
    return { perfil: guardado, planRegenerado: plan !== null, plan };
  }
}
