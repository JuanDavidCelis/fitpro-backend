import { Injectable } from '@nestjs/common';
import {
  StoredUserProfile,
  UserProfileData,
  UserProfileRepositoryPort,
} from '../ports/repositories';
import { PrismaService } from './PrismaService';

/** ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts). */
@Injectable()
export class PrismaUserProfileRepository implements UserProfileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<StoredUserProfile | null> {
    const row = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!row) return null;
    return this.toStoredProfile(row as any);
  }

  async upsert(userId: string, data: UserProfileData): Promise<StoredUserProfile> {
    const row = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        edad: data.edad,
        sexo: data.sexo,
        pesoKg: data.pesoKg,
        alturaCm: data.alturaCm,
        nivelExperiencia: data.nivelExperiencia as any,
        lesiones: data.lesiones,
        dolorActual: data.dolorActual,
        requiereConsulta: data.requiereConsulta,
        musculosPrioritarios: data.musculosPrioritarios,
        pesoObjetivoKg: data.pesoObjetivoKg,
      },
      create: {
        userId,
        edad: data.edad,
        sexo: data.sexo,
        pesoKg: data.pesoKg,
        alturaCm: data.alturaCm,
        nivelExperiencia: data.nivelExperiencia as any,
        lesiones: data.lesiones,
        dolorActual: data.dolorActual,
        requiereConsulta: data.requiereConsulta,
        musculosPrioritarios: data.musculosPrioritarios,
        pesoObjetivoKg: data.pesoObjetivoKg,
      },
      include: { user: true },
    });
    return this.toStoredProfile(row as any);
  }

  private toStoredProfile(row: any): StoredUserProfile {
    return {
      id: row.id,
      userId: row.userId,
      user: {
        id: row.user.id,
        email: row.user.email,
        nombre: row.user.nombre,
      },
      edad: row.edad,
      sexo: row.sexo,
      pesoKg: row.pesoKg,
      alturaCm: row.alturaCm,
      nivelExperiencia: row.nivelExperiencia,
      lesiones: Array.isArray(row.lesiones) ? (row.lesiones as string[]) : [],
      dolorActual: Array.isArray(row.dolorActual) ? (row.dolorActual as string[]) : [],
      requiereConsulta: row.requiereConsulta,
      musculosPrioritarios: Array.isArray(row.musculosPrioritarios) ? (row.musculosPrioritarios as string[]) : [],
      pesoObjetivoKg: row.pesoObjetivoKg ?? null,
      updatedAt: row.updatedAt,
    };
  }
}