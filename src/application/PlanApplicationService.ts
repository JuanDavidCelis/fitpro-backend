import { EngineInput, UserSettings, WorkoutPlanResult } from '../domain/types';
import { EXERCISES } from '../data/exercises';
import { construirLimitaciones } from '../domain/health';
import { generateWorkoutPlan } from '../engine/generatePlan';
import { PlanRepositoryPort, RecoveryRepositoryPort, StoredPlan } from '../persistence/ports/repositories';
import { SessionRepositoryPort } from '../persistence/ports/repositories';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  /**
   * Sustituye un ejercicio en el plan activo por otro del mismo grupo muscular.
   * Valida que el nuevo ejercicio es una alternativa válida (está en la lista
   * de alternativas del ejercicio original o comparte el mismo grupo primario).
   */
  async substituteExercise(
    userId: string,
    workoutDayId: string,
    oldExerciseId: string,
    newExerciseId: string,
    motivo: string,
  ): Promise<StoredPlan> {
    // 1. Obtener el plan activo para validar
    const plan = await this.planRepo.findActiveByUser(userId);
    if (!plan) {
      throw new NotFoundException('No tienes un plan activo. Genera uno primero.');
    }

    // 2. Encontrar el día y el ejercicio original
    const dia = plan.plan.dias.find((d) => d.id === workoutDayId);
    if (!dia) {
      throw new NotFoundException('Día de entrenamiento no encontrado en el plan activo.');
    }

    const ejercicioOriginal = dia.ejercicios.find((e) => e.exerciseId === oldExerciseId);
    if (!ejercicioOriginal) {
      throw new NotFoundException('Ejercicio no encontrado en el día especificado.');
    }

    // 3. Validar que el nuevo ejercicio existe
    const nuevoEjercicio = EXERCISES.find((e) => e.id === newExerciseId);
    if (!nuevoEjercicio) {
      throw new BadRequestException('El ejercicio de sustitución no existe en el catálogo.');
    }

    // 4. Validar que el nuevo ejercicio es una alternativa válida
    const ejercicioOriginalCatalogo = EXERCISES.find((e) => e.id === oldExerciseId);
    const esAlternativaValida =
      ejercicioOriginalCatalogo?.alternativas.includes(newExerciseId) ??
      false;
    const mismoGrupoPrimario =
      ejercicioOriginalCatalogo?.grupoPrimario === nuevoEjercicio.grupoPrimario;

    if (!esAlternativaValida && !mismoGrupoPrimario) {
      throw new BadRequestException(
        'El ejercicio seleccionado no es una alternativa válida para este grupo muscular.',
      );
    }

    // 5. Persistir la sustitución
    return this.planRepo.substituteExercise(userId, workoutDayId, oldExerciseId, newExerciseId, motivo);
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
