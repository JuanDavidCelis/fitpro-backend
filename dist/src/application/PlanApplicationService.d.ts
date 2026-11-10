import { EngineInput, UserSettings } from '../domain/types';
import { PlanRepositoryPort, RecoveryRepositoryPort, StoredPlan } from '../persistence/ports/repositories';
/**
 * Orquesta: construir el historial real desde los repositorios + invocar el
 * motor determinista + persistir la nueva versión. Ninguna decisión de
 * entrenamiento se toma aquí; solo se ensambla el input y se guarda el
 * output. Esto corresponde al bloque "Motor de reglas -> Plan -> Validación"
 * del pipeline de IA (sección 27 del documento de diseño).
 */
export declare class PlanApplicationService {
    private readonly planRepo;
    private readonly recoveryRepo;
    constructor(planRepo: PlanRepositoryPort, recoveryRepo: RecoveryRepositoryPort);
    generateAndPersist(userId: string, partialInput: Omit<EngineInput, 'historial'>, historialManual?: EngineInput['historial']): Promise<StoredPlan>;
    /**
     * Genera y guarda una NUEVA versión de la rutina a partir de los ajustes
     * guardados del usuario (nivel, objetivo, días, equipo, salud...). Es el
     * único camino por el que se regenera la rutina al cambiar la configuración.
     */
    generateFromSettings(userId: string, s: UserSettings): Promise<StoredPlan>;
    getActivePlan(userId: string): Promise<StoredPlan | null>;
    getVersionHistory(userId: string): Promise<StoredPlan[]>;
    /**
     * Sustituye un ejercicio en el plan activo por otro del mismo grupo muscular.
     * Valida que el nuevo ejercicio es una alternativa válida (está en la lista
     * de alternativas del ejercicio original o comparte el mismo grupo primario).
     */
    substituteExercise(userId: string, workoutDayId: string, oldExerciseId: string, newExerciseId: string, motivo: string): Promise<StoredPlan>;
    private buildHistorialFromRepos;
}
