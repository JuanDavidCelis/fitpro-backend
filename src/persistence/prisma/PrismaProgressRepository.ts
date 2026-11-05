import { Injectable } from '@nestjs/common';
import { ProgressRepositoryPort, WeightRecord } from '../ports/repositories';
import { PrismaService } from './PrismaService';

/** Registros de peso en la tabla ProgressRecord (filas pequeñas: ~1 por mes por usuario). */
@Injectable()
export class PrismaProgressRepository implements ProgressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async addWeight(userId: string, pesoKg: number): Promise<WeightRecord> {
    const r = await this.prisma.progressRecord.create({ data: { userId, pesoKg, fuente: 'manual' } });
    return { id: r.id, fecha: r.fecha, pesoKg: r.pesoKg as number };
  }

  async listWeights(userId: string, limit: number): Promise<WeightRecord[]> {
    // Se piden los más recientes y se devuelven en orden cronológico.
    const rows = await this.prisma.progressRecord.findMany({
      where: { userId, pesoKg: { not: null } },
      orderBy: { fecha: 'desc' },
      take: limit,
    });
    return (rows as any[]).reverse().map((r) => ({ id: r.id, fecha: r.fecha, pesoKg: r.pesoKg as number }));
  }
}
