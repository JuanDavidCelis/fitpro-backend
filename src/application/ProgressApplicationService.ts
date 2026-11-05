import { BadRequestException } from '@nestjs/common';
import { ProfileRepositoryPort, ProgressRepositoryPort, WeightRecord } from '../persistence/ports/repositories';

const MAX_REGISTROS = 400;

export interface WeightHistory {
  pesoObjetivoKg: number | null;
  registros: WeightRecord[];
}

export class ProgressApplicationService {
  constructor(
    private readonly progressRepo: ProgressRepositoryPort,
    private readonly profileRepo: ProfileRepositoryPort,
  ) {}

  async addWeight(userId: string, body: unknown): Promise<WeightRecord> {
    const crudo = (body as { pesoKg?: unknown } | null)?.pesoKg;
    if (typeof crudo !== 'number' || !Number.isFinite(crudo) || crudo < 20 || crudo > 400) {
      throw new BadRequestException('El peso debe ser un número entre 20 y 400 kg.');
    }
    const pesoKg = Math.round(crudo * 10) / 10;
    const registro = await this.progressRepo.addWeight(userId, pesoKg);
    // El peso del perfil refleja siempre el último registrado.
    await this.profileRepo.updateCurrentWeight(userId, pesoKg);
    return registro;
  }

  async getHistory(userId: string): Promise<WeightHistory> {
    const [registros, perfil] = await Promise.all([
      this.progressRepo.listWeights(userId, MAX_REGISTROS),
      this.profileRepo.findByUser(userId),
    ]);
    return { pesoObjetivoKg: perfil?.pesoObjetivoKg ?? null, registros };
  }
}
