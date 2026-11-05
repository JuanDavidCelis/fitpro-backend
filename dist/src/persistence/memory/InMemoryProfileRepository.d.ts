import { UserSettings } from '../../domain/types';
import { ProfileRepositoryPort } from '../ports/repositories';
export declare class InMemoryProfileRepository implements ProfileRepositoryPort {
    private perfiles;
    findByUser(userId: string): Promise<UserSettings | null>;
    save(userId: string, settings: UserSettings): Promise<UserSettings>;
    updateCurrentWeight(userId: string, pesoKg: number): Promise<void>;
}
