import { UserSettings } from '../../domain/types';
import { ProfileRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';
/** Lee/escribe la tabla UserProfile (1 fila por usuario). */
export declare class PrismaProfileRepository implements ProfileRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUser(userId: string): Promise<UserSettings | null>;
    save(userId: string, s: UserSettings): Promise<UserSettings>;
    updateCurrentWeight(userId: string, pesoKg: number): Promise<void>;
}
