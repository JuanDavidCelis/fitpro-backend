import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserInput, StoredUser, UserRepositoryPort } from '../ports/repositories';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private users: (StoredUser & { firebaseUid: string })[] = [];

  async create(input: CreateUserInput): Promise<StoredUser> {
    const existente = this.users.find((u) => u.email === input.email);
    if (existente) {
      throw new Error(`Ya existe un usuario con el email ${input.email}`);
    }
    const nuevo = {
      id: randomUUID(),
      email: input.email,
      nombre: input.nombre,
      createdAt: new Date(),
      firebaseUid: input.firebaseUid ?? input.email,
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

  async findByFirebaseUid(firebaseUid: string): Promise<StoredUser | null> {
    return this.users.find((u) => u.firebaseUid === firebaseUid) ?? null;
  }
}
