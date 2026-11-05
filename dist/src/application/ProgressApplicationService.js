"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressApplicationService = void 0;
const common_1 = require("@nestjs/common");
const MAX_REGISTROS = 400;
class ProgressApplicationService {
    constructor(progressRepo, profileRepo) {
        this.progressRepo = progressRepo;
        this.profileRepo = profileRepo;
    }
    async addWeight(userId, body) {
        const crudo = body?.pesoKg;
        if (typeof crudo !== 'number' || !Number.isFinite(crudo) || crudo < 20 || crudo > 400) {
            throw new common_1.BadRequestException('El peso debe ser un número entre 20 y 400 kg.');
        }
        const pesoKg = Math.round(crudo * 10) / 10;
        const registro = await this.progressRepo.addWeight(userId, pesoKg);
        // El peso del perfil refleja siempre el último registrado.
        await this.profileRepo.updateCurrentWeight(userId, pesoKg);
        return registro;
    }
    async getHistory(userId) {
        const [registros, perfil] = await Promise.all([
            this.progressRepo.listWeights(userId, MAX_REGISTROS),
            this.profileRepo.findByUser(userId),
        ]);
        return { pesoObjetivoKg: perfil?.pesoObjetivoKg ?? null, registros };
    }
}
exports.ProgressApplicationService = ProgressApplicationService;
