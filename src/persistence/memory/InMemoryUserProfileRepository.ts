import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  StoredUserProfile,
  UserProfileData,
  UserProfileRepositoryPort,
} from '../ports/repositories';

/**
 * Implementación en memoria del repositorio de perfiles de usuario.
 * Usada en modo desarrollo (USE_IN_MEMORY_DB=true) para tests y demo sin BD.
 */
@Injectable()
export class InMemoryUserProfileRepository implements UserProfileRepositoryPort {
  private profiles: Map<string, StoredUserProfile> = new Map();

  async findByUserId(userId: string): Promise<StoredUserProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async upsert(userId: string, data: UserProfileData): Promise<StoredUserProfile> {
    const existente = this.profiles.get(userId);
    const stored: StoredUserProfile = {
      id: existente?.id ?? randomUUID(),
      userId,
      user: existente?.user ?? { id: userId, email: '', nombre: '' },
      edad: data.edad,
      sexo: data.sexo,
      pesoKg: data.pesoKg,
      alturaCm: data.alturaCm,
      nivelExperiencia: data.nivelExperiencia,
      lesiones: data.lesiones,
      dolorActual: data.dolorActual,
      requiereConsulta: data.requiereConsulta,
      musculosPrioritarios: data.musculosPrioritarios,
      pesoObjetivoKg: data.pesoObjetivoKg,
      updatedAt: new Date(),
    };
    this.profiles.set(userId, stored);
    return stored;
  }
}