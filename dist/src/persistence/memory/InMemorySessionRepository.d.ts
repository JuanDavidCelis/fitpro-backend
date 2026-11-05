import { SessionLog } from '../../engine/adaptationEngine';
import { FinishSessionInput, LogSetInput, SessionRepositoryPort, SessionSummary, StartSessionInput, StoredExerciseSet, StoredSession } from '../ports/repositories';
export declare class InMemorySessionRepository implements SessionRepositoryPort {
    private sessions;
    private sets;
    private static readonly RETENCION_SESIONES_POR_EJERCICIO;
    startSession(input: StartSessionInput): Promise<StoredSession>;
    logSet(input: LogSetInput): Promise<StoredExerciseSet>;
    findLastCompletedSession(userId: string, workoutDayIds: string[]): Promise<StoredSession | null>;
    finishSession(input: FinishSessionInput): Promise<SessionSummary>;
    /**
     * Conserva, por cada ejercicio tocado en la sesión recién cerrada, solo
     * las series de las últimas RETENCION_SESIONES_POR_EJERCICIO sesiones
     * (por fecha) de ese usuario para ese ejercicio; borra el resto. Se
     * ejecuta al finalizar cada sesión para que la tabla nunca crezca sin
     * límite en el plan gratuito.
     */
    private pruneOldSetsForExercises;
    findRecentSessionLogs(userId: string, exerciseId: string, limitSesiones: number): Promise<SessionLog[]>;
}
