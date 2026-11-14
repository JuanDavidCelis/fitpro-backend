import { Injectable } from '@nestjs/common';
import { EXERCISES } from '../../data/exercises';
import { Exercise } from '../../domain/types';
import { ExerciseRepositoryPort } from '../ports/exerciseRepository';

@Injectable()
export class InMemoryExerciseRepository implements ExerciseRepositoryPort {
  async findAll(): Promise<Exercise[]> {
    return EXERCISES;
  }

  async findById(id: string): Promise<Exercise | null> {
    return EXERCISES.find((e) => e.id === id) ?? null;
  }
}
