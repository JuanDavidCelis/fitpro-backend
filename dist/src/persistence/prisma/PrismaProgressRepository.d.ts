import { ProgressRepositoryPort, WeightRecord } from '../ports/repositories';
import { PrismaService } from './PrismaService';
/** Registros de peso en la tabla ProgressRecord (filas pequeñas: ~1 por mes por usuario). */
export declare class PrismaProgressRepository implements ProgressRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addWeight(userId: string, pesoKg: number): Promise<WeightRecord>;
    listWeights(userId: string, limit: number): Promise<WeightRecord[]>;
}
