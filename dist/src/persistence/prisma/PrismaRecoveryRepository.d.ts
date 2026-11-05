import { RecoveryRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';
/** ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts). */
export declare class PrismaRecoveryRepository implements RecoveryRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    averageRecentRecoveryScore(userId: string, ultimosNRegistros: number): Promise<number>;
}
