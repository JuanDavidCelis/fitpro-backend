"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionApplicationService = void 0;
const common_1 = require("@nestjs/common");
const adaptationEngine_1 = require("../engine/adaptationEngine");
/**
 * Orquesta el ciclo de vida de una sesión de entrenamiento:
 *   iniciar (botón "INICIAR ENTRENAMIENTO") -> registrar series -> finalizar
 *   (calcula estadísticas: peso total, series, tiempo).
 * decideAdaptation() en sí es puro y ya está cubierto por tests; aquí solo
 * se valida el ensamblado de datos reales.
 */
class SessionApplicationService {
    constructor(sessionRepo, recoveryRepo, planRepo) {
        this.sessionRepo = sessionRepo;
        this.recoveryRepo = recoveryRepo;
        this.planRepo = planRepo;
    }
    /**
     * Inicia una sesión sobre el día `diaOrden` del plan ACTIVO del usuario.
     * No acepta un workoutDayId arbitrario del cliente: se resuelve siempre
     * contra el plan activo real, para que no se puedan registrar series
     * contra un día que no pertenece a la versión vigente del plan.
     */
    async startSession(userId, diaOrden) {
        const planActivo = await this.planRepo.findActiveByUser(userId);
        if (!planActivo) {
            throw new common_1.NotFoundException('No tienes un plan activo. Genera uno primero.');
        }
        const dia = planActivo.plan.dias.find((d) => d.orden === diaOrden);
        if (!dia) {
            throw new common_1.NotFoundException(`El día ${diaOrden} no existe en tu plan activo.`);
        }
        if (!dia.id) {
            // No debería ocurrir nunca en un plan ya persistido; si pasa, es un
            // bug de mapeo (Prisma/memoria) y hay que fallar fuerte, no adivinar.
            throw new common_1.BadRequestException('El día del plan no tiene un identificador persistido válido.');
        }
        return this.sessionRepo.startSession({ userId, workoutDayId: dia.id });
    }
    /**
     * Próxima sesión del plan ACTIVO: el día siguiente al de la última sesión
     * completada (y vuelve al día 1 después del último). Ignora las sesiones
     * de versiones anteriores del plan: si regeneras la rutina, empiezas en el día 1.
     */
    async getNextSession(userId) {
        const plan = await this.planRepo.findActiveByUser(userId);
        if (!plan || plan.plan.dias.length === 0) {
            throw new common_1.NotFoundException('No tienes un plan activo. Genera uno primero.');
        }
        const dias = [...plan.plan.dias].sort((a, b) => a.orden - b.orden);
        const ids = dias.map((d) => d.id).filter((id) => !!id);
        const ultima = await this.sessionRepo.findLastCompletedSession(userId, ids);
        const idx = ultima ? dias.findIndex((d) => d.id === ultima.workoutDayId) : -1;
        if (!ultima || idx < 0) {
            return { diaOrden: dias[0].orden, ultimoDiaOrden: null, ultimaFecha: null };
        }
        return {
            diaOrden: dias[(idx + 1) % dias.length].orden,
            ultimoDiaOrden: dias[idx].orden,
            ultimaFecha: ultima.fecha.toISOString(),
        };
    }
    async logSet(input) {
        return this.sessionRepo.logSet(input);
    }
    async finishSession(input) {
        return this.sessionRepo.finishSession(input);
    }
    async decideAdaptationForExercise(userId, exerciseId, limitSesiones = 3) {
        const historial = await this.sessionRepo.findRecentSessionLogs(userId, exerciseId, limitSesiones);
        const recoveryPromedio = await this.recoveryRepo.averageRecentRecoveryScore(userId, 7);
        return (0, adaptationEngine_1.decideAdaptation)(historial, recoveryPromedio);
    }
}
exports.SessionApplicationService = SessionApplicationService;
