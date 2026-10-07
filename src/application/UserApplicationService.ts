import { NotFoundException } from '@nestjs/common';
import { CreateUserInput, StoredUser, UserRepositoryPort } from '../persistence/ports/repositories';

export class UserApplicationService {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  async register(input: CreateUserInput): Promise<StoredUser> {
    return this.userRepo.create(input);
  }

  async getById(id: string): Promise<StoredUser> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no existe`);
    }
    return user;
  }

  /**
   * Usado por otros módulos (plans, sessions) para validar que el userId
   * recibido en la ruta corresponde a un usuario real, en vez de aceptar
   * cualquier string como si fuera válido.
   */
  async assertExists(id: string): Promise<void> {
    const existe = await this.userRepo.existsById(id);
    if (!existe) {
      throw new NotFoundException(`Usuario ${id} no existe`);
    }
  }
}
