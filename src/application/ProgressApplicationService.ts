import { Injectable } from '@nestjs/common';
import { ProgressRepositoryPort, StoredProgressRecord } from '../persistence/ports/repositories';

export interface ProgressResponse {
  records: StoredProgressRecord[];
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  weightDeltaKg: number | null;
  progressPercent: number | null;
}

/**
 * Orquesta la lectura/creación de registros de progreso (peso, medidas).
 * Calcula deltas y porcentaje de progreso hacia el peso objetivo.
 */
@Injectable()
export class ProgressApplicationService {
  constructor(private readonly progressRepo: ProgressRepositoryPort) {}

  async getProgress(userId: string, targetWeightKg: number | null): Promise<ProgressResponse> {
    const records = await this.progressRepo.findByUser(userId);
    const currentWeightKg = records.length > 0 ? records[records.length - 1].pesoKg : null;
    const weightDeltaKg =
      currentWeightKg !== null && targetWeightKg !== null
        ? currentWeightKg - targetWeightKg
        : null;
    const progressPercent =
      currentWeightKg !== null && targetWeightKg !== null && currentWeightKg !== 0
        ? (1 - weightDeltaKg! / currentWeightKg) * 100
        : null;

    return {
      records,
      currentWeightKg,
      targetWeightKg,
      weightDeltaKg,
      progressPercent,
    };
  }

  async registerWeight(
    userId: string,
    pesoKg: number | null,
    fuente: string = 'manual',
  ): Promise<StoredProgressRecord> {
    return this.progressRepo.create(userId, { pesoKg, fuente });
  }
}