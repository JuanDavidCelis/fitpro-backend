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
exports.PlansModule = exports.PLAN_APPLICATION_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const persistence_module_1 = require("../../persistence/persistence.module");
const tokens_1 = require("../../persistence/tokens");
const PlanApplicationService_1 = require("../../application/PlanApplicationService");
const generate_plan_dto_1 = require("../dto/generate-plan.dto");
const substitute_exercise_dto_1 = require("../dto/substitute-exercise.dto");
const users_module_1 = require("../users/users.module");
const UserApplicationService_1 = require("../../application/UserApplicationService");
const media_1 = require("../../application/media");
const auth_module_1 = require("../../auth/auth.module");
const SupabaseAuthGuard_1 = require("../../auth/SupabaseAuthGuard");
const SameUserGuard_1 = require("../../auth/SameUserGuard");
// Nota de diseño: este endpoint persiste (crea una nueva versión de
// WorkoutPlan ligada al usuario). Es distinto del endpoint stateless
// POST /workout-plans/generate (WorkoutEngineController), que solo invoca
// el motor sin guardar nada — útil para previsualizar un plan antes de
// confirmarlo, o para los tests de validación del motor en aislamiento.
// Se define el provider del servicio de aplicación dentro de este módulo
// (en vez de en persistence.module.ts) porque PlanApplicationService
// pertenece a la capa de aplicación, no a la de persistencia — solo
// depende de los puertos, nunca de Prisma directamente.
exports.PLAN_APPLICATION_SERVICE = Symbol('PLAN_APPLICATION_SERVICE');
// Orden de guards: primero autentica (¿quién eres?), luego autoriza
// (¿puedes operar sobre este :userId?). SameUserGuard depende de que
// SupabaseAuthGuard ya haya adjuntado req.user.
let PlansController = class PlansController {
    constructor(service, users) {
        this.service = service;
        this.users = users;
    }
    async generate(userId, dto) {
        // SameUserGuard ya garantiza que quien llama ES userId; assertExists
        // sigue haciendo falta porque un usuario puede existir en Firebase Auth
        // pero no haber completado el registro/perfil en nuestra base de datos.
        await this.users.assertExists(userId);
        const errores = (0, generate_plan_dto_1.validateGeneratePlanDto)(dto);
        if (errores.length > 0) {
            throw new common_1.BadRequestException({ message: 'Datos de entrada inválidos', errores });
        }
        const stored = await this.service.generateAndPersist(userId, {
            perfil: dto.perfil,
            objetivo: dto.objetivo,
            disponibilidad: dto.disponibilidad,
            equipamientoDisponible: dto.equipamientoDisponible ?? [],
            preferencias: dto.preferencias,
            limitaciones: dto.limitaciones,
        });
        return (0, media_1.withMedia)(stored);
    }
    async getActive(userId) {
        await this.users.assertExists(userId);
        const plan = await this.service.getActivePlan(userId);
        if (!plan) {
            // 404 explícito (en vez de un 200 con cuerpo vacío): el cliente móvil
            // distingue así "aún no tienes plan" de un error real.
            throw new common_1.NotFoundException('No tienes un plan activo. Genera uno primero.');
        }
        return (0, media_1.withMedia)(plan);
    }
    async getHistory(userId) {
        await this.users.assertExists(userId);
        return (await this.service.getVersionHistory(userId)).map(media_1.withMedia);
    }
    async substituteExercise(userId, dto) {
        await this.users.assertExists(userId);
        const errores = (0, substitute_exercise_dto_1.validateSubstituteExerciseDto)(dto);
        if (errores.length > 0) {
            throw new common_1.BadRequestException({ message: 'Datos de entrada inválidos', errores });
        }
        const stored = await this.service.substituteExercise(userId, dto.workoutDayId, dto.oldExerciseId, dto.newExerciseId, dto.motivo);
        return (0, media_1.withMedia)(stored);
    }
};
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, generate_plan_dto_1.GeneratePlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('substitute-exercise'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, substitute_exercise_dto_1.SubstituteExerciseDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "substituteExercise", null);
PlansController = __decorate([
    (0, common_1.Controller)('users/:userId/workout-plans'),
    (0, common_1.UseGuards)(SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard),
    __param(0, (0, common_1.Inject)(exports.PLAN_APPLICATION_SERVICE)),
    __param(1, (0, common_1.Inject)(users_module_1.USER_APPLICATION_SERVICE)),
    __metadata("design:paramtypes", [PlanApplicationService_1.PlanApplicationService,
        UserApplicationService_1.UserApplicationService])
], PlansController);
let PlansModule = class PlansModule {
};
exports.PlansModule = PlansModule;
exports.PlansModule = PlansModule = __decorate([
    (0, common_1.Module)({
        imports: [persistence_module_1.PersistenceModule, users_module_1.UsersModule, auth_module_1.AuthModule],
        controllers: [PlansController],
        providers: [
            {
                provide: exports.PLAN_APPLICATION_SERVICE,
                useFactory: (planRepo, recoveryRepo, exerciseRepo) => new PlanApplicationService_1.PlanApplicationService(planRepo, recoveryRepo, exerciseRepo),
                inject: [tokens_1.PLAN_REPOSITORY, tokens_1.RECOVERY_REPOSITORY, tokens_1.EXERCISE_REPOSITORY],
            },
        ],
        exports: [exports.PLAN_APPLICATION_SERVICE],
    })
], PlansModule);
