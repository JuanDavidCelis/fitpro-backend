import { ProfileRepositoryPort, ProgressRepositoryPort, WeightRecord } from '../persistence/ports/repositories';
export interface WeightHistory {
    pesoObjetivoKg: number | null;
    registros: WeightRecord[];
}
export declare class ProgressApplicationService {
    private readonly progressRepo;
    private readonly profileRepo;
    constructor(progressRepo: ProgressRepositoryPort, profileRepo: ProfileRepositoryPort);
    addWeight(userId: string, body: unknown): Promise<WeightRecord>;
    getHistory(userId: string): Promise<WeightHistory>;
}
