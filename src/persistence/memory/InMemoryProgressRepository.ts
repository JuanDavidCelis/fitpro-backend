import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ProgressRepositoryPort, WeightRecord } from '../ports/repositories';

@Injectable()
export class InMemoryProgressRepository implements ProgressRepositoryPort {
  private registros: (WeightRecord & { userId: string })[] = [];

  async addWeight(userId: string, pesoKg: number): Promise<WeightRecord> {
    const r = { id: randomUUID(), userId, fecha: new Date(), pesoKg };
    this.registros.push(r);
    return { id: r.id, fecha: r.fecha, pesoKg: r.pesoKg };
  }

  async listWeights(userId: string, limit: number): Promise<WeightRecord[]> {
    return this.registros
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(-limit)
      .map((r) => ({ id: r.id, fecha: r.fecha, pesoKg: r.pesoKg }));
  }
}
