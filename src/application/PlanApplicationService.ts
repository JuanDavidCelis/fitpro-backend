import { EngineInput, UserSettings, WorkoutPlanResult } from '../domain/types';
import { construirLimitaciones } from '../domain/health';
import { generateWorkoutPlan } from '../engine/generatePlan';
import { PlanRepositoryPort, RecoveryRepositoryPort, StoredPlan } from '../persistence/ports/repositories';
import { SessionRepositoryPort } from '../persistence/ports/repositories';

/**
 * Orquesta: construir el historial real desde los repositorios + invocar el
 * motor determinista + persistir la nueva versión. Ninguna decisión de
 * entrenamiento se toma aquí; solo se ensambla el input y se guarda el
 * output. Esto corresponde al bloque "Motor de reglas -> Plan -> Validación"
 * del pipeline de IA (sección 27 del documento de diseño).
 */
export class PlanApplicationService {
  constructor(
    private readonly planRepo: PlanRepositoryPort,
    private readonly recoveryRepo: RecoveryRepositoryPort,
  ) {}

  async generateAndPersist(
    userId: string,
    partialInput: Omit<EngineInput, 'historial'>,
    historialManual?: EngineInput['historial'],
  ): Promise<StoredPlan> {
    const historial =
      historialManual ??
      (await this.buildHistorialFromRepos(userId));

    const input: EngineInput = { ...partialInput, historial };
    const plan: WorkoutPlanResult = generateWorkoutPlan(input);
    return this.planRepo.saveNewVersion(userId, plan);
  }

  /**
   * Genera y guarda una NUEVA versión de la rutina a partir de los ajustes
   * guardados del usuario (nivel, objetivo, días, equipo, salud...). Es el
   * único camino por el que se regenera la rutina al cambiar la configuración.
   */
  async generateFromSettings(userId: string, s: UserSettings): Promise<StoredPlan> {
    return this.generateAndPersist(userId, {
      perfil: {
        edad: s.edad,
        sexo: s.sexo,
        pesoKg: s.pesoKg,
        alturaCm: s.alturaCm,
        nivelExperiencia: s.nivelExperiencia,
      },
      objetivo: s.objetivo,
      disponibilidad: { diasPorSemana: s.diasPorSemana, minutosPorSesion: s.minutosPorSesion },
      equipamientoDisponible: s.equipamiento,
      preferencias: {
        musculosPrioritarios: s.musculosPrioritarios,
        modalidadCardioPreferida: [],
        ejerciciosExcluidosIds: [],
        ejerciciosFavoritosIds: [],
        solicitaOlympia: false, // Olympia no se pide desde la app: ver levelSelection
      },
      limitaciones: construirLimitaciones(s.lesiones, s.dolorActual, s.condicionMedica),
    });
  }

  async getActivePlan(userId: string): Promise<StoredPlan | null> {
    return this.planRepo.findActiveByUser(userId);
  }

  async getVersionHistory(userId: string): Promise<StoredPlan[]> {
    return this.planRepo.findAllVersionsByUser(userId);
  }

  private async buildHistorialFromRepos(userId: string): Promise<EngineInput['historial']> {
    const recoveryScorePromedio = await this.recoveryRepo.averageRecentRecoveryScore(userId, 7);
    const versiones = await this.planRepo.findAllVersionsByUser(userId);

    if (versiones.length === 0) {
      return null; // usuario nuevo, sin historial
    }

    // Estimación simple de semanas entrenando a partir de la primera versión
    // del plan. En producción esto se refina con fechas reales de sesiones.
    const primeraVersion = versiones[0];
    const semanasEntrenando = Math.max(
      1,
      Math.round((Date.now() - primeraVersion.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)),
    );

    return {
      semanasEntrenando,
      adherenciaUltimasSemanas: 0.8, // TODO(fase-1): calcular real desde WorkoutSession completadas/planificadas
      recoveryScorePromedio,
      rirPromedioReciente: null,
      tendenciaRendimiento: 'estable',
    };
  }
}
