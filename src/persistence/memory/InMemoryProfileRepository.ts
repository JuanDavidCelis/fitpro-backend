import { Injectable } from '@nestjs/common';
import { UserSettings } from '../../domain/types';
import { ProfileRepositoryPort } from '../ports/repositories';

@Injectable()
export class InMemoryProfileRepository implements ProfileRepositoryPort {
  private perfiles = new Map<string, UserSettings>();

  async findByUser(userId: string): Promise<UserSettings | null> {
    const p = this.perfiles.get(userId);
    return p ? structuredClone(p) : null;
  }

  async save(userId: string, settings: UserSettings): Promise<UserSettings> {
    this.perfiles.set(userId, structuredClone(settings));
    return structuredClone(settings);
  }

  async updateCurrentWeight(userId: string, pesoKg: number): Promise<void> {
    const p = this.perfiles.get(userId);
    if (p) p.pesoKg = pesoKg;
  }
}
