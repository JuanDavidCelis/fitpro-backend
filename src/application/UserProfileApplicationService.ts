import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoredUserProfile, UserProfileData, UserProfileRepositoryPort } from '../persistence/ports/repositories';

export interface ProfileResponse {
  hasProfile: boolean;
  profile: StoredUserProfile | null;
}

export interface UpdateProfileInput {
  edad?: number;
  sexo?: string;
  pesoKg?: number;
  alturaCm?: number;
  nivelExperiencia?: string;
  lesiones?: string[];
  dolorActual?: string[];
  requiereConsulta?: boolean;
  musculosPrioritarios?: string[];
  pesoObjetivoKg?: number | null;
}

/**
 * Orquesta la lectura/escritura del perfil completo del usuario.
 * Las validaciones de rango se aquí (no en el cliente) para que sean
 * aplicables también a futuras fuentes de datos (ej. importación CSV).
 */
@Injectable()
export class UserProfileApplicationService {
  constructor(private readonly profileRepo: UserProfileRepositoryPort) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const profile = await this.profileRepo.findByUserId(userId);
    return { hasProfile: profile !== null, profile };
  }

  async upsertProfile(userId: string, data: UpdateProfileInput): Promise<StoredUserProfile> {
    const existente = await this.profileRepo.findByUserId(userId);
    const fused: UserProfileData = {
      edad: data.edad ?? existente?.edad ?? 0,
      sexo: data.sexo ?? existente?.sexo ?? 'prefiero_no_decir',
      pesoKg: data.pesoKg ?? existente?.pesoKg ?? 0,
      alturaCm: data.alturaCm ?? existente?.alturaCm ?? 0,
      nivelExperiencia: data.nivelExperiencia ?? existente?.nivelExperiencia ?? 'principiante',
      lesiones: data.lesiones ?? existente?.lesiones ?? [],
      dolorActual: data.dolorActual ?? existente?.dolorActual ?? [],
      requiereConsulta: data.requiereConsulta ?? existente?.requiereConsulta ?? false,
      musculosPrioritarios: data.musculosPrioritarios ?? existente?.musculosPrioritarios ?? [],
      pesoObjetivoKg: data.pesoObjetivoKg !== undefined ? data.pesoObjetivoKg : existente?.pesoObjetivoKg ?? null,
    };

    this.validate(fused);
    return this.profileRepo.upsert(userId, fused);
  }

  private validate(data: UserProfileData): void {
    if (data.edad < 14 || data.edad > 90) {
      throw new BadRequestException('La edad debe estar entre 14 y 90 años');
    }
    if (data.pesoKg <= 0 || data.pesoKg > 400) {
      throw new BadRequestException('El peso debe estar entre 0 y 400 kg');
    }
    if (data.alturaCm <= 0 || data.alturaCm > 260) {
      throw new BadRequestException('La altura debe estar entre 0 y 260 cm');
    }
    if (!['principiante', 'intermedio', 'avanzado'].includes(data.nivelExperiencia)) {
      throw new BadRequestException('Nivel de experiencia inválido');
    }
    if (data.pesoObjetivoKg !== null && (data.pesoObjetivoKg <= 0 || data.pesoObjetivoKg > 400)) {
      throw new BadRequestException('El peso objetivo debe estar entre 0 y 400 kg');
    }
  }
}