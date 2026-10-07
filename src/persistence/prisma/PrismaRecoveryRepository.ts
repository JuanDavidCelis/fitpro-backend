import { Injectable } from '@nestjs/common';
import { RecoveryRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';

/** ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts). */
@Injectable()
export class PrismaRecoveryRepository implements RecoveryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async averageRecentRecoveryScore(userId: string, ultimosNRegistros: number): Promise<number> {
    const registros = await this.prisma.recoveryRecord.findMany({
      where: { userId },
      orderBy: { fecha: 'desc' },
      take: ultimosNRegistros,
    });

    if (registros.length === 0) return 70; // valor neutro por defecto sin datos
    const suma = registros.reduce((acc: number, r: any) => acc + r.recoveryScore, 0);
    return suma / registros.length;
  }
}
