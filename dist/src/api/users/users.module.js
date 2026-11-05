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
exports.UsersModule = exports.USER_APPLICATION_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const persistence_module_1 = require("../../persistence/persistence.module");
const tokens_1 = require("../../persistence/tokens");
const UserApplicationService_1 = require("../../application/UserApplicationService");
const auth_module_1 = require("../../auth/auth.module");
const SupabaseAuthGuard_1 = require("../../auth/SupabaseAuthGuard");
const SameUserGuard_1 = require("../../auth/SameUserGuard");
const CurrentUser_decorator_1 = require("../../auth/CurrentUser.decorator");
exports.USER_APPLICATION_SERVICE = Symbol('USER_APPLICATION_SERVICE');
class RegisterUserBody {
}
let UsersController = class UsersController {
    constructor(service) {
        this.service = service;
    }
    /**
     * Crea el perfil de negocio de la cuenta que acaba de iniciar sesión en
     * Supabase Auth (o devuelve el existente). Idempotente.
     */
    async register(identity, body) {
        return this.service.registerOrGet({
            id: identity.uid,
            email: identity.email ?? `${identity.uid}@sin-email.fitpro`,
            nombre: body?.nombre,
        });
    }
    async getById(userId) {
        return this.service.getById(userId);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard),
    __param(0, (0, CurrentUser_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RegisterUserBody]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getById", null);
UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __param(0, (0, common_1.Inject)(exports.USER_APPLICATION_SERVICE)),
    __metadata("design:paramtypes", [UserApplicationService_1.UserApplicationService])
], UsersController);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [persistence_module_1.PersistenceModule, auth_module_1.AuthModule],
        controllers: [UsersController],
        providers: [
            {
                provide: exports.USER_APPLICATION_SERVICE,
                useFactory: (userRepo) => new UserApplicationService_1.UserApplicationService(userRepo),
                inject: [tokens_1.USER_REPOSITORY],
            },
        ],
        exports: [exports.USER_APPLICATION_SERVICE],
    })
], UsersModule);
