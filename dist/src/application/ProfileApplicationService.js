"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileApplicationService = void 0;
const common_1 = require("@nestjs/common");
const settings_1 = require("../domain/settings");
class ProfileApplicationService {
    constructor(profileRepo, planService) {
        this.profileRepo = profileRepo;
        this.planService = planService;
    }
    async getProfile(userId) {
        const p = await this.profileRepo.findByUser(userId);
        if (!p)
            throw new common_1.NotFoundException('Aún no has completado tu perfil.');
        return p;
    }
    /**
     * Guarda TODOS los ajustes del usuario y, si cambió algo que afecta a la
     * rutina (nivel, objetivo, días, minutos, equipo, salud, músculos
     * prioritarios), o si todavía no tiene rutina, genera una nueva versión de
     * forma automática. Cambiar solo el peso objetivo no toca la rutina.
     */
    async saveProfile(userId, body, forzar = false) {
        const v = (0, settings_1.validateUserSettings)(body);
        if (!v.ok)
            throw new common_1.BadRequestException({ message: 'Datos de perfil inválidos', errores: v.errores });
        const previo = await this.profileRepo.findByUser(userId);
        const guardado = await this.profileRepo.save(userId, v.value);
        const planActivo = await this.planService.getActivePlan(userId);
        const regenerar = forzar || !planActivo || !previo || (0, settings_1.trainingFieldsChanged)(previo, guardado);
        const plan = regenerar ? await this.planService.generateFromSettings(userId, guardado) : null;
        return { perfil: guardado, planRegenerado: plan !== null, plan };
    }
}
exports.ProfileApplicationService = ProfileApplicationService;
