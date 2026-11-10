import { Injectable } from '@nestjs/common';
import { WorkoutPlanResult } from '../../domain/types';
import { EXERCISES } from '../../data/exercises';
import { PlanRepositoryPort, StoredPlan } from '../ports/repositories';
import { randomUUID } from 'crypto';

/**
 * Implementación en memoria, útil para tests y para desarrollo local sin
 * levantar PostgreSQL. Implementa exactamente el mismo contrato que la
 * versión Prisma (ver persistence/prisma), por lo que los servicios de
 * aplicación que dependen del puerto no notan la diferencia.
 */
@Injectable()
export class InMemoryPlanRepository implements PlanRepositoryPort {
  private plans: StoredPlan[] = [];

  async findActiveByUser(userId: string): Promise<StoredPlan | null> {
    return this.plans.find((p) => p.userId === userId && p.activo) ?? null;
  }

  async saveNewVersion(userId: string, plan: WorkoutPlanResult): Promise<StoredPlan> {
    const versionesPrevias = this.plans.filter((p) => p.userId === userId);
    const siguienteVersion = versionesPrevias.length + 1;

    // Regla de negocio (documento de diseño, sección 5 del modelo de datos):
    // nunca se muta un plan existente; se crea una nueva versión y se
    // desactivan todas las anteriores del usuario.
    for (const p of versionesPrevias) {
      p.activo = false;
    }

    const nuevoId = randomUUID();
    // Cada día recibe un id propio (aunque esta implementación no tenga
    // tablas separadas): es lo que permite al cliente decir "quiero iniciar
    // una sesión sobre el día 3 de mi plan actual" de forma no ambigua,
    // igual que ocurre con WorkoutDay.id en la versión Prisma.
    const planConDiasConId: WorkoutPlanResult = {
      ...plan,
      dias: plan.dias.map((dia) => ({ ...dia, id: `${nuevoId}_dia_${dia.orden}` })),
    };

    const nuevo: StoredPlan = {
      id: nuevoId,
      userId,
      version: siguienteVersion,
      activo: true,
      plan: planConDiasConId,
      createdAt: new Date(),
    };
    this.plans.push(nuevo);
    return nuevo;
  }

  async findAllVersionsByUser(userId: string): Promise<StoredPlan[]> {
    return this.plans
      .filter((p) => p.userId === userId)
      .sort((a, b) => a.version - b.version);
  }

  async substituteExercise(
    userId: string,
    workoutDayId: string,
    oldExerciseId: string,
    newExerciseId: string,
    motivo: string,
  ): Promise<StoredPlan> {
    const planIndex = this.plans.findIndex((p) => p.userId === userId && p.activo);
    if (planIndex === -1) {
      throw new Error('No active plan found for user');
    }

    const plan = this.plans[planIndex];
    const dia = plan.plan.dias.find((d) => d.id === workoutDayId);
    if (!dia) {
      throw new Error('Workout day not found in active plan');
    }

    const ejercicioIndex = dia.ejercicios.findIndex((e) => e.exerciseId === oldExerciseId);
    if (ejercicioIndex === -1) {
      throw new Error('Exercise not found in the specified workout day');
    }

    // Validar que el nuevo ejercicio existe en el catálogo
    const nuevoEjercicio = EXERCISES.find((e) => e.id === newExerciseId);
    if (!nuevoEjercicio) {
      throw new Error('Replacement exercise not found in catalog');
    }

    // Sustituir el ejercicio manteniendo la misma estructura
    const ejercicioActual = dia.ejercicios[ejercicioIndex];
    dia.ejercicios[ejercicioIndex] = {
      ...ejercicioActual,
      exerciseId: newExerciseId,
      sustituidoDesde: oldExerciseId,
      motivoSustitucion: motivo,
    };

    // El plan ya está actualizado (mutación in-place para in-memory)
    return plan;
  }
}
