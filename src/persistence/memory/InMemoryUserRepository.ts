import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserInput, StoredUser, UserRepositoryPort } from '../ports/repositories';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private users: StoredUser[] = [];

  async create(input: CreateUserInput): Promise<StoredUser> {
    if (this.users.some((u) => u.id === input.id)) {
      throw new ConflictException(`Ya existe un usuario con el id ${input.id}`);
    }
    if (this.users.some((u) => u.email === input.email)) {
      throw new ConflictException(`Ya existe un usuario con el email ${input.email}`);
    }
    const nuevo: StoredUser = {
      id: input.id,
      email: input.email,
      nombre: input.nombre,
      createdAt: new Date(),
    };
    this.users.push(nuevo);
    return nuevo;
  }

  async findById(id: string): Promise<StoredUser | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.users.some((u) => u.id === id);
  }
}
