import { Injectable } from '@nestjs/common';
import {
  ProgressRepositoryPort,
  StoredProgressRecord,
} from '../ports/repositories';
import { PrismaService } from './PrismaService';

/** ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts). */
@Injectable()
export class PrismaProgressRepository implements ProgressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<StoredProgressRecord[]> {
    const rows = await this.prisma.progressRecord.findMany({
      where: { userId },
      orderBy: { fecha: 'asc' },
    });
    return (rows as any[]).map((r) => this.toStored(r));
  }

  async create(
    userId: string,
    data: { pesoKg?: number | null; medidas?: Record<string, number> | null; fuente?: string },
  ): Promise<StoredProgressRecord> {
    const row = await this.prisma.progressRecord.create({
      data: {
        userId,
        pesoKg: data.pesoKg ?? null,
        medidas: data.medidas ?? undefined,
        fotoUrls: [],
        fuente: data.fuente ?? 'manual',
      },
    });
    return this.toStored(row as any);
  }

  private toStored(row: any): StoredProgressRecord {
    return {
      id: row.id,
      userId: row.userId,
      fecha: row.fecha,
      pesoKg: row.pesoKg ?? null,
      medidas: row.medidas ?? null,
      fotoUrls: Array.isArray(row.fotoUrls) ? (row.fotoUrls as string[]) : [],
      fuente: row.fuente,
    };
  }
}