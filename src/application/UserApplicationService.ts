import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoredUser, UserRepositoryPort } from '../persistence/ports/repositories';

export interface RegisterOrGetInput {
  /** uid de Supabase Auth (claim sub ya verificado). */
  id: string;
  email: string;
  nombre?: unknown;
}

const NOMBRE_MAX = 60;

export class UserApplicationService {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  /**
   * Crea el perfil de negocio del usuario autenticado, o devuelve el que ya
   * existe. Es idempotente a propósito: iniciar sesión en un teléfono nuevo
   * llama al mismo endpoint sin duplicar ni fallar.
   */
  async registerOrGet(input: RegisterOrGetInput): Promise<StoredUser> {
    const existente = await this.userRepo.findById(input.id);
    if (existente) return existente;

    const nombre = this.normalizarNombre(input.nombre, input.email);
    try {
      return await this.userRepo.create({ id: input.id, email: input.email, nombre });
    } catch (e) {
      // Dos peticiones simultáneas: la otra pudo crearlo un instante antes.
      const creadoPorOtra = await this.userRepo.findById(input.id);
      if (creadoPorOtra) return creadoPorOtra;
      throw e;
    }
  }

  async getById(id: string): Promise<StoredUser> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario ${id} no existe`);
    }
    return user;
  }

  /**
   * Usado por otros módulos (plans, sessions): un usuario puede estar
   * autenticado en Supabase pero no haber creado aún su perfil aquí.
   */
  async assertExists(id: string): Promise<void> {
    const existe = await this.userRepo.existsById(id);
    if (!existe) {
      throw new NotFoundException(`Usuario ${id} no existe. Completa tu registro primero (POST /users).`);
    }
  }

  private normalizarNombre(nombre: unknown, email: string): string {
    if (nombre === undefined || nombre === null) {
      return this.nombrePorDefecto(email);
    }
    if (typeof nombre !== 'string') {
      throw new BadRequestException('El nombre debe ser texto');
    }
    const limpio = nombre.trim();
    if (limpio.length === 0) return this.nombrePorDefecto(email);
    if (limpio.length > NOMBRE_MAX) {
      throw new BadRequestException(`El nombre es demasiado largo (máximo ${NOMBRE_MAX} caracteres)`);
    }
    return limpio;
  }

  private nombrePorDefecto(email: string): string {
    const local = email.split('@')[0]?.trim();
    return local ? local.slice(0, NOMBRE_MAX) : 'Atleta';
  }
}
