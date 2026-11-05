import { RecoveryRepositoryPort } from '../ports/repositories';
export declare class InMemoryRecoveryRepository implements RecoveryRepositoryPort {
    private records;
    add(userId: string, recoveryScore: number): void;
    averageRecentRecoveryScore(userId: string, ultimosNRegistros: number): Promise<number>;
}
