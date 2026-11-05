"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const persistence_module_1 = require("../../persistence/persistence.module");
const tokens_1 = require("../../persistence/tokens");
const SessionApplicationService_1 = require("../../application/SessionApplicationService");
const users_module_1 = require("../users/users.module");
const UserApplicationService_1 = require("../../application/UserApplicationService");
const auth_module_1 = require("../../auth/auth.module");
const SupabaseAuthGuard_1 = require("../../auth/SupabaseAuthGuard");
const SameUserGuard_1 = require("../../auth/SameUserGuard");
const SESSION_APPLICATION_SERVICE = Symbol('SESSION_APPLICATION_SERVICE');
class StartSessionBody {
}
class LogSetBody {
}
class FinishSessionBody {
}
let SessionsController = class SessionsController {
    constructor(service, users) {
        this.service = service;
        this.users = users;
    }
    /**
     * Botón "INICIAR ENTRENAMIENTO" (sección 13). Crea la sesión sobre el día
     * indicado del plan ACTIVO del usuario y devuelve el sessionId a usar en
     * las siguientes llamadas de esta pantalla.
     */
    async start(userId, body) {
        await this.users.assertExists(userId);
        return this.service.startSession(userId, body.diaOrden);
    }
    async logSet(userId, body) {
        await this.users.assertExists(userId);
        return this.service.logSet({ userId, ...body });
    }
    /**
     * Cierra la sesión y calcula las estadísticas finales (peso total
     * levantado, series, repeticiones, duración) a partir de lo realmente
     * persistido — nunca confiando en un total que el cliente calcule solo.
     */
    async finish(userId, sessionId, body) {
        await this.users.assertExists(userId);
        return this.service.finishSession({ sessionId, userId, ...body });
    }
    /** Qué día del plan toca ahora (para "Próxima sesión" del dashboard). */
    async getNext(userId) {
        await this.users.assertExists(userId);
        return this.service.getNextSession(userId);
    }
    async getAdaptation(userId, exerciseId) {
        await this.users.assertExists(userId);
        return this.service.decideAdaptationForExercise(userId, exerciseId);
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, StartSessionBody]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('sets'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, LogSetBody]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "logSet", null);
__decorate([
    (0, common_1.Post)(':sessionId/finish'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, FinishSessionBody]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "finish", null);
__decorate([
    (0, common_1.Get)('next'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getNext", null);
__decorate([
    (0, common_1.Get)('adaptation'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('exerciseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getAdaptation", null);
SessionsController = __decorate([
    (0, common_1.Controller)('users/:userId/sessions'),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard),
    __param(0, (0, common_1.Inject)(SESSION_APPLICATION_SERVICE)),
    __param(1, (0, common_1.Inject)(users_module_1.USER_APPLICATION_SERVICE)),
    __metadata("design:paramtypes", [SessionApplicationService_1.SessionApplicationService,
        UserApplicationService_1.UserApplicationService])
], SessionsController);
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [persistence_module_1.PersistenceModule, users_module_1.UsersModule, auth_module_1.AuthModule],
        controllers: [SessionsController],
        providers: [
            {
                provide: SESSION_APPLICATION_SERVICE,
                useFactory: (sessionRepo, recoveryRepo, planRepo) => new SessionApplicationService_1.SessionApplicationService(sessionRepo, recoveryRepo, planRepo),
                inject: [tokens_1.SESSION_REPOSITORY, tokens_1.RECOVERY_REPOSITORY, tokens_1.PLAN_REPOSITORY],
            },
        ],
    })
], SessionsModule);
