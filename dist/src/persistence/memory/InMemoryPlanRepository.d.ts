import { WorkoutPlanResult } from '../../domain/types';
import { PlanRepositoryPort, StoredPlan } from '../ports/repositories';
/**
 * Implementación en memoria, útil para tests y para desarrollo local sin
 * levantar PostgreSQL. Implementa exactamente el mismo contrato que la
 * versión Prisma (ver persistence/prisma), por lo que los servicios de
 * aplicación que dependen del puerto no notan la diferencia.
 */
export declare class InMemoryPlanRepository implements PlanRepositoryPort {
    private plans;
    findActiveByUser(userId: string): Promise<StoredPlan | null>;
    saveNewVersion(userId: string, plan: WorkoutPlanResult): Promise<StoredPlan>;
    findAllVersionsByUser(userId: string): Promise<StoredPlan[]>;
}
