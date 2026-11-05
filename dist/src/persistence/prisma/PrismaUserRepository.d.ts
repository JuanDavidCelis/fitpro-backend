import { CreateUserInput, StoredUser, UserRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';
export declare class PrismaUserRepository implements UserRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreateUserInput): Promise<StoredUser>;
    findById(id: string): Promise<StoredUser | null>;
    existsById(id: string): Promise<boolean>;
}
