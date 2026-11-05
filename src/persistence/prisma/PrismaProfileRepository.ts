import { Injectable } from '@nestjs/common';
import { UserSettings } from '../../domain/types';
import { ProfileRepositoryPort } from '../ports/repositories';
import { PrismaService } from './PrismaService';

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function toSettings(r: any): UserSettings {
  return {
    edad: r.edad,
    sexo: r.sexo,
    pesoKg: r.pesoKg,
    alturaCm: r.alturaCm,
    nivelExperiencia: r.nivelExperiencia,
    objetivo: r.objetivo,
    diasPorSemana: r.diasPorSemana,
    minutosPorSesion: r.minutosPorSesion,
    equipamiento: arr(r.equipamiento),
    pesoObjetivoKg: r.pesoObjetivoKg ?? null,
    lesiones: arr(r.lesiones),
    dolorActual: arr(r.dolorActual),
    condicionMedica: r.condicionMedica === true,
    musculosPrioritarios: arr(r.musculosPrioritarios),
  };
}

/** Lee/escribe la tabla UserProfile (1 fila por usuario). */
@Injectable()
export class PrismaProfileRepository implements ProfileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<UserSettings | null> {
    const row = await this.prisma.userProfile.findUnique({ where: { userId } });
    return row ? toSettings(row) : null;
  }

  async save(userId: string, s: UserSettings): Promise<UserSettings> {
    const data = {
      edad: s.edad,
      sexo: s.sexo,
      pesoKg: s.pesoKg,
      alturaCm: s.alturaCm,
      nivelExperiencia: s.nivelExperiencia,
      objetivo: s.objetivo,
      diasPorSemana: s.diasPorSemana,
      minutosPorSesion: s.minutosPorSesion,
      equipamiento: s.equipamiento,
      pesoObjetivoKg: s.pesoObjetivoKg,
      lesiones: s.lesiones,
      dolorActual: s.dolorActual,
      condicionMedica: s.condicionMedica,
      // Derivado: dolor actual o condición médica => recomendar consulta profesional.
      requiereConsulta: s.condicionMedica || s.dolorActual.length > 0,
      musculosPrioritarios: s.musculosPrioritarios,
    };
    const row = await this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return toSettings(row);
  }

  async updateCurrentWeight(userId: string, pesoKg: number): Promise<void> {
    await this.prisma.userProfile.updateMany({ where: { userId }, data: { pesoKg } });
  }
}
