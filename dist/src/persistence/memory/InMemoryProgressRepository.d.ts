import { ProgressRepositoryPort, WeightRecord } from '../ports/repositories';
export declare class InMemoryProgressRepository implements ProgressRepositoryPort {
    private registros;
    addWeight(userId: string, pesoKg: number): Promise<WeightRecord>;
    listWeights(userId: string, limit: number): Promise<WeightRecord[]>;
}
