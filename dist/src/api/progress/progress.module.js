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
exports.ProgressModule = void 0;
const common_1 = require("@nestjs/common");
const persistence_module_1 = require("../../persistence/persistence.module");
const tokens_1 = require("../../persistence/tokens");
const ProgressApplicationService_1 = require("../../application/ProgressApplicationService");
const UserApplicationService_1 = require("../../application/UserApplicationService");
const auth_module_1 = require("../../auth/auth.module");
const SupabaseAuthGuard_1 = require("../../auth/SupabaseAuthGuard");
const SameUserGuard_1 = require("../../auth/SameUserGuard");
const users_module_1 = require("../users/users.module");
const PROGRESS_APPLICATION_SERVICE = Symbol('PROGRESS_APPLICATION_SERVICE');
let ProgressController = class ProgressController {
    constructor(service, users) {
        this.service = service;
        this.users = users;
    }
    /** Historial de peso (para el gráfico) + peso objetivo del perfil. */
    async history(userId) {
        await this.users.assertExists(userId);
        return this.service.getHistory(userId);
    }
    async add(userId, body) {
        await this.users.assertExists(userId);
        return this.service.addWeight(userId, body);
    }
};
__decorate([
    (0, common_1.Get)('weight'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "history", null);
__decorate([
    (0, common_1.Post)('weight'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "add", null);
ProgressController = __decorate([
    (0, common_1.Controller)('users/:userId/progress'),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard),
    __param(0, (0, common_1.Inject)(PROGRESS_APPLICATION_SERVICE)),
    __param(1, (0, common_1.Inject)(users_module_1.USER_APPLICATION_SERVICE)),
    __metadata("design:paramtypes", [ProgressApplicationService_1.ProgressApplicationService,
        UserApplicationService_1.UserApplicationService])
], ProgressController);
let ProgressModule = class ProgressModule {
};
exports.ProgressModule = ProgressModule;
exports.ProgressModule = ProgressModule = __decorate([
    (0, common_1.Module)({
        imports: [persistence_module_1.PersistenceModule, users_module_1.UsersModule, auth_module_1.AuthModule],
        controllers: [ProgressController],
        providers: [
            {
                provide: PROGRESS_APPLICATION_SERVICE,
                useFactory: (progress, profile) => new ProgressApplicationService_1.ProgressApplicationService(progress, profile),
                inject: [tokens_1.PROGRESS_REPOSITORY, tokens_1.PROFILE_REPOSITORY],
            },
        ],
    })
], ProgressModule);
