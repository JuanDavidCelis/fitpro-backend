import { Injectable } from '@nestjs/common';
import { Exercise } from '../../domain/types';
import { EXERCISES as DEFAULT_EXERCISES } from '../../data/exercises';
import { ExerciseRepositoryPort } from '../ports/exerciseRepository';
import { PrismaService } from './PrismaService';

/**
 * Lee el catálogo de ejercicios desde la BD (fuente de verdad cuando hay
 * ejercicios nuevos añadidos por fuera del código). Si la tabla aún no tiene
 * datos, cae al catálogo in-memory para no romper entornos sin seed.
 */
@Injectable()
export class PrismaExerciseRepository implements ExerciseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Exercise[]> {
    try {
      const rows = await this.prisma.exercise.findMany();
      if (!rows || rows.length === 0) return DEFAULT_EXERCISES;
      return rows.map((r: any) => this.toExercise(r));
    } catch {
      return DEFAULT_EXERCISES;
    }
  }

  async findById(id: string): Promise<Exercise | null> {
    try {
      const r = await this.prisma.exercise.findUnique({ where: { id } });
      return r ? this.toExercise(r) : null;
    } catch {
      return DEFAULT_EXERCISES.find((e) => e.id === id) ?? null;
    }
  }

  private toExercise(r: any): Exercise {
    return {
      id: r.id,
      nombre: r.nombre,
      grupoPrimario: r.grupoPrimario,
      gruposSecundarios: Array.isArray(r.gruposSecundarios) ? r.gruposSecundarios : [],
      equipamientoRequerido: Array.isArray(r.equipamientoRequerido) ? r.equipamientoRequerido : [],
      nivelMinimo: r.nivelMinimo,
      patron: r.patron,
      instrucciones: r.instrucciones ?? '',
      erroresComunes: Array.isArray(r.erroresComunes) ? r.erroresComunes : [],
      etiquetas: Array.isArray(r.etiquetas) ? r.etiquetas : [],
      alternativas: Array.isArray(r.alternativas) ? r.alternativas : [],
    };
  }
}
