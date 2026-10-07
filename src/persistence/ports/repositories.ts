import { WorkoutPlanResult } from '../../domain/types';
import { SessionLog } from '../../engine/adaptationEngine';

// ============================================================================
// Puertos (arquitectura hexagonal). El motor de reglas y los servicios de
// aplicación dependen SOLO de estas interfaces, nunca de Prisma directamente.
// Esto permite testear toda la lógica de orquestación con implementaciones
// en memoria, sin necesitar una base de datos real levantada.
// ============================================================================

export interface StoredPlan {
  id: string;
  userId: string;
  version: number;
  activo: boolean;
  plan: WorkoutPlanResult;
  createdAt: Date;
}

export interface PlanRepositoryPort {
  /** Devuelve el plan activo actual del usuario, o null si nunca generó uno. */
  findActiveByUser(userId: string): Promise<StoredPlan | null>;
  /** Guarda un nuevo plan como versión siguiente y marca los anteriores como inactivos. */
  saveNewVersion(userId: string, plan: WorkoutPlanResult): Promise<StoredPlan>;
  /** Historial completo de versiones (para que la IA explique "por qué cambió tu rutina"). */
  findAllVersionsByUser(userId: string): Promise<StoredPlan[]>;
}

export interface StoredExerciseSet {
  id: string;
  sessionId: string;
  userId: string;
  exerciseId: string;
  fecha: Date;
  numeroSerie: number;
  pesoKg: number;
  repsRealizadas: number;
  rirReportado: number | null;
  repsObjetivoMax: number;
}

export interface LogSetInput {
  sessionId: string;
  userId: string;
  exerciseId: string;
  numeroSerie: number;
  pesoKg: number;
  repsRealizadas: number;
  rirReportado: number | null;
  repsObjetivoMax: number;
}

export interface SessionRepositoryPort {
  logSet(input: LogSetInput): Promise<StoredExerciseSet>;
  /**
   * Devuelve el historial reciente de un ejercicio concreto agrupado por
   * sesión (más antigua primero), listo para alimentar decideAdaptation().
   * `limitSesiones` acota cuántas sesiones recientes se consideran.
   */
  findRecentSessionLogs(
    userId: string,
    exerciseId: string,
    limitSesiones: number,
  ): Promise<SessionLog[]>;

  /**
   * Crea la sesión de entrenamiento (botón "INICIAR ENTRENAMIENTO", sección
   * 13/14). Debe existir ANTES de poder registrar series con logSet(), ya
   * que ExerciseSet cuelga de una sesión real. `workoutDayId` es el id del
   * día ya persistido (WorkoutDayPlan.id) sobre el que se entrena hoy.
   */
  startSession(input: StartSessionInput): Promise<StoredSession>;

  /**
   * Cierra la sesión y calcula el resumen final (sección "estadísticas al
   * finalizar": peso total levantado, series realizadas, tiempo total). El
   * cálculo se hace aquí, no en el cliente, para que el número mostrado sea
   * siempre trazable a los datos realmente persistidos.
   */
  finishSession(input: FinishSessionInput): Promise<SessionSummary>;
}

export interface StartSessionInput {
  userId: string;
  workoutDayId: string;
}

export interface StoredSession {
  id: string;
  userId: string;
  workoutDayId: string;
  fecha: Date;
  estado: 'en_progreso' | 'completada' | 'parcial' | 'omitida';
}

export interface FinishSessionInput {
  sessionId: string;
  userId: string;
  duracionRealSeg: number;
  fatigaPercibida?: number | null;
  // Si el usuario completó todas las series planificadas o solo algunas;
  // lo decide el cliente según cuántos ejercicios llegó a registrar.
  estado?: 'completada' | 'parcial';
}

export interface SessionSummary {
  sessionId: string;
  duracionRealSeg: number;
  totalSeries: number;
  totalRepeticiones: number;
  volumenTotalKg: number; // sumatoria de peso × repeticiones de cada serie
  ejerciciosRealizados: number; // ejercicios distintos con al menos 1 serie registrada
  estado: 'completada' | 'parcial';
}

export interface RecoveryRepositoryPort {
  /** Promedio de recovery score de los últimos N registros del usuario. */
  averageRecentRecoveryScore(userId: string, ultimosNRegistros: number): Promise<number>;
}

export interface StoredUser {
  id: string;
  email: string;
  nombre: string;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  nombre: string;
  // En producción, el id real viene del token de Firebase Auth verificado
  // (firebaseUid); aquí se acepta opcionalmente para desarrollo/tests.
  firebaseUid?: string;
}

export interface UserRepositoryPort {
  create(input: CreateUserInput): Promise<StoredUser>;
  findById(id: string): Promise<StoredUser | null>;
  existsById(id: string): Promise<boolean>;
  /** Resuelve la identidad interna (id de BD) a partir del uid de Firebase. */
  findByFirebaseUid(firebaseUid: string): Promise<StoredUser | null>;
}
