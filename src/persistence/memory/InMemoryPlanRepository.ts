import { Injectable } from '@nestjs/common';
import { WorkoutPlanResult } from '../../domain/types';
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
}
