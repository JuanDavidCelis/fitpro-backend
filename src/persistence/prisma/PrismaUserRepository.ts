import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserInput, StoredUser, UserRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<StoredUser> {
    try {
      const created = await this.prisma.user.create({
        data: { id: input.id, email: input.email, nombre: input.nombre },
      });
      return { id: created.id, email: created.email, nombre: created.nombre, createdAt: created.createdAt };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(`Ya existe un usuario con ese id o con el email ${input.email}`);
      }
      throw e;
    }
  }

  async findById(id: string): Promise<StoredUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, email: row.email, nombre: row.nombre, createdAt: row.createdAt };
  }

  async existsById(id: string): Promise<boolean> {
    const row = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    return row !== null;
  }
}
