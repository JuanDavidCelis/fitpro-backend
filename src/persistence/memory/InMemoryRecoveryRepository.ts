import { Injectable } from '@nestjs/common';
import { RecoveryRepositoryPort } from '../ports/repositories';

@Injectable()
export class InMemoryRecoveryRepository implements RecoveryRepositoryPort {
  private records: { userId: string; recoveryScore: number; fecha: Date }[] = [];

  add(userId: string, recoveryScore: number): void {
    this.records.push({ userId, recoveryScore, fecha: new Date() });
  }

  async averageRecentRecoveryScore(userId: string, ultimosNRegistros: number): Promise<number> {
    const propios = this.records
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, ultimosNRegistros);

    if (propios.length === 0) return 70; // valor neutro por defecto sin datos
    return propios.reduce((acc, r) => acc + r.recoveryScore, 0) / propios.length;
  }
}
