import { CreateUserInput, StoredUser, UserRepositoryPort } from '../ports/repositories';
export declare class InMemoryUserRepository implements UserRepositoryPort {
    private users;
    create(input: CreateUserInput): Promise<StoredUser>;
    findById(id: string): Promise<StoredUser | null>;
    existsById(id: string): Promise<boolean>;
}
