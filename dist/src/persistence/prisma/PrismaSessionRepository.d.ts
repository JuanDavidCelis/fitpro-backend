import { SessionLog } from '../../engine/adaptationEngine';
import { FinishSessionInput, LogSetInput, SessionRepositoryPort, SessionSummary, StartSessionInput, StoredExerciseSet, StoredSession } from '../ports/repositories';
import { PrismaService } from './PrismaService';
/**
 * ⚠️ Implementación no verificada en ejecución (ver PrismaService.ts).
 *
 * Restricción real del esquema relacional: `ExerciseSet` cuelga de
 * `WorkoutExercise` (la instancia planificada de un ejercicio dentro de un
 * día concreto), no directamente de `Exercise`. Por eso registrar una serie
 * requiere que ya exista una `WorkoutSession` — de ahí que startSession()
 * sea un paso obligatorio antes de logSet().
 */
export declare class PrismaSessionRepository implements SessionRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private static readonly RETENCION_SESIONES_POR_EJERCICIO;
    startSession(input: StartSessionInput): Promise<StoredSession>;
    logSet(input: LogSetInput): Promise<StoredExerciseSet>;
    findLastCompletedSession(userId: string, workoutDayIds: string[]): Promise<StoredSession | null>;
    finishSession(input: FinishSessionInput): Promise<SessionSummary>;
    /**
     * Equivalente relacional de la poda en memoria: por cada ejercicio de la
     * sesión recién cerrada, busca las sesiones de este usuario que incluyeron
     * ese ejercicio, ordenadas por fecha, y borra los ExerciseSet de las que
     * excedan la ventana de retención. No borra las sesiones en sí (quedan
     * como registro de adherencia/racha), solo el detalle serie a serie.
     */
    private pruneOldSetsForExercises;
    findRecentSessionLogs(userId: string, exerciseId: string, limitSesiones: number): Promise<SessionLog[]>;
}
