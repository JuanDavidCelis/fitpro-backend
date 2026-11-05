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
exports.ProfileModule = void 0;
const common_1 = require("@nestjs/common");
const persistence_module_1 = require("../../persistence/persistence.module");
const tokens_1 = require("../../persistence/tokens");
const ProfileApplicationService_1 = require("../../application/ProfileApplicationService");
const UserApplicationService_1 = require("../../application/UserApplicationService");
const media_1 = require("../../application/media");
const auth_module_1 = require("../../auth/auth.module");
const SupabaseAuthGuard_1 = require("../../auth/SupabaseAuthGuard");
const SameUserGuard_1 = require("../../auth/SameUserGuard");
const plans_module_1 = require("../plans/plans.module");
const users_module_1 = require("../users/users.module");
const PROFILE_APPLICATION_SERVICE = Symbol('PROFILE_APPLICATION_SERVICE');
let ProfileController = class ProfileController {
    constructor(service, users) {
        this.service = service;
        this.users = users;
    }
    async get(userId) {
        await this.users.assertExists(userId);
        return this.service.getProfile(userId);
    }
    /**
     * Guarda todos los ajustes del usuario (datos, nivel, objetivo, días,
     * equipo, salud, peso objetivo). Si algo afecta a la rutina, devuelve la
     * rutina nueva en `plan`; si no, `plan` es null.
     */
    async put(userId, body, forzar) {
        await this.users.assertExists(userId);
        const r = await this.service.saveProfile(userId, body, forzar === 'true');
        return { perfil: r.perfil, planRegenerado: r.planRegenerado, plan: r.plan ? (0, media_1.withMedia)(r.plan) : null };
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('forzar')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "put", null);
ProfileController = __decorate([
    (0, common_1.Controller)('users/:userId/profile'),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard),
    __param(0, (0, common_1.Inject)(PROFILE_APPLICATION_SERVICE)),
    __param(1, (0, common_1.Inject)(users_module_1.USER_APPLICATION_SERVICE)),
    __metadata("design:paramtypes", [ProfileApplicationService_1.ProfileApplicationService,
        UserApplicationService_1.UserApplicationService])
], ProfileController);
let ProfileModule = class ProfileModule {
};
exports.ProfileModule = ProfileModule;
exports.ProfileModule = ProfileModule = __decorate([
    (0, common_1.Module)({
        imports: [persistence_module_1.PersistenceModule, users_module_1.UsersModule, auth_module_1.AuthModule, plans_module_1.PlansModule],
        controllers: [ProfileController],
        providers: [
            {
                provide: PROFILE_APPLICATION_SERVICE,
                useFactory: (repo, plans) => new ProfileApplicationService_1.ProfileApplicationService(repo, plans),
                inject: [tokens_1.PROFILE_REPOSITORY, plans_module_1.PLAN_APPLICATION_SERVICE],
            },
        ],
    })
], ProfileModule);
