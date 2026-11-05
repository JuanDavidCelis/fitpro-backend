"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const workout_engine_module_1 = require("./api/workout-engine/workout-engine.module");
const plans_module_1 = require("./api/plans/plans.module");
const sessions_module_1 = require("./api/sessions/sessions.module");
const users_module_1 = require("./api/users/users.module");
const profile_module_1 = require("./api/profile/profile.module");
const progress_module_1 = require("./api/progress/progress.module");
// Pendiente (fase 1 backend, ver roadmap):
// import { AuthModule } from './auth/auth.module';
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [workout_engine_module_1.WorkoutEngineModule, users_module_1.UsersModule, plans_module_1.PlansModule, sessions_module_1.SessionsModule, profile_module_1.ProfileModule, progress_module_1.ProgressModule],
    })
], AppModule);
