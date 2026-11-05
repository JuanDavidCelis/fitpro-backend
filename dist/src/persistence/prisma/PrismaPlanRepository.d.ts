import { WorkoutPlanResult } from '../../domain/types';
import { PlanRepositoryPort, StoredPlan } from '../ports/repositories';
import { PrismaService } from './PrismaService';
/**
 * ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts).
 * Escribe/lee el plan de forma completamente relacional, tal como está
 * modelado en schema.prisma (WorkoutPlan -> WorkoutDay -> WorkoutExercise).
 * Requiere que el catálogo de ejercicios ya esté sembrado (prisma/seed.ts)
 * antes de poder crear un WorkoutExercise (FK a Exercise.id).
 */
export declare class PrismaPlanRepository implements PlanRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findActiveByUser(userId: string): Promise<StoredPlan | null>;
    saveNewVersion(userId: string, plan: WorkoutPlanResult): Promise<StoredPlan>;
    findAllVersionsByUser(userId: string): Promise<StoredPlan[]>;
    private toStoredPlan;
}
