import { Exercise } from '../../domain/types';

export interface ExerciseRepositoryPort {
  /** Devuelve el catálogo completo de ejercicios disponibles para generar planes. */
  findAll(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
}
