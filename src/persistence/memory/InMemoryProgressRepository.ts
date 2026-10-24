import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ProgressRepositoryPort,
  StoredProgressRecord,
} from '../ports/repositories';

/**
 * Implementación en memoria del repositorio de progreso (peso, medidas).
 * Usada en modo desarrollo (USE_IN_MEMORY_DB=true).
 */
@Injectable()
export class InMemoryProgressRepository implements ProgressRepositoryPort {
  private records: StoredProgressRecord[] = [];

  async findByUser(userId: string): Promise<StoredProgressRecord[]> {
    return this.records
      .filter((r) => r.userId === userId)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }

  async create(
    userId: string,
    data: { pesoKg?: number | null; medidas?: Record<string, number> | null; fuente?: string },
  ): Promise<StoredProgressRecord> {
    const nuevo: StoredProgressRecord = {
      id: randomUUID(),
      userId,
      fecha: new Date(),
      pesoKg: data.pesoKg ?? null,
      medidas: data.medidas ?? null,
      fotoUrls: [],
      fuente: data.fuente ?? 'manual',
    };
    this.records.push(nuevo);
    return nuevo;
  }
}