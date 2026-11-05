import { AdaptationAction } from '../engine/adaptationEngine';
import { FinishSessionInput, LogSetInput, PlanRepositoryPort, RecoveryRepositoryPort, SessionRepositoryPort, SessionSummary, StoredSession } from '../persistence/ports/repositories';
export interface NextSession {
    diaOrden: number;
    ultimoDiaOrden: number | null;
    ultimaFecha: string | null;
}
/**
 * Orquesta el ciclo de vida de una sesión de entrenamiento:
 *   iniciar (botón "INICIAR ENTRENAMIENTO") -> registrar series -> finalizar
 *   (calcula estadísticas: peso total, series, tiempo).
 * decideAdaptation() en sí es puro y ya está cubierto por tests; aquí solo
 * se valida el ensamblado de datos reales.
 */
export declare class SessionApplicationService {
    private readonly sessionRepo;
    private readonly recoveryRepo;
    private readonly planRepo;
    constructor(sessionRepo: SessionRepositoryPort, recoveryRepo: RecoveryRepositoryPort, planRepo: PlanRepositoryPort);
    /**
     * Inicia una sesión sobre el día `diaOrden` del plan ACTIVO del usuario.
     * No acepta un workoutDayId arbitrario del cliente: se resuelve siempre
     * contra el plan activo real, para que no se puedan registrar series
     * contra un día que no pertenece a la versión vigente del plan.
     */
    startSession(userId: string, diaOrden: number): Promise<StoredSession>;
    /**
     * Próxima sesión del plan ACTIVO: el día siguiente al de la última sesión
     * completada (y vuelve al día 1 después del último). Ignora las sesiones
     * de versiones anteriores del plan: si regeneras la rutina, empiezas en el día 1.
     */
    getNextSession(userId: string): Promise<NextSession>;
    logSet(input: LogSetInput): Promise<import("../persistence/ports/repositories").StoredExerciseSet>;
    finishSession(input: FinishSessionInput): Promise<SessionSummary>;
    decideAdaptationForExercise(userId: string, exerciseId: string, limitSesiones?: number): Promise<AdaptationAction>;
}
