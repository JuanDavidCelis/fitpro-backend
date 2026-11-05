"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutEngineService = void 0;
const common_1 = require("@nestjs/common");
const generatePlan_1 = require("../../engine/generatePlan");
const generate_plan_dto_1 = require("../dto/generate-plan.dto");
/**
 * Capa de aplicación entre el controller HTTP y el Rules Engine puro.
 * Responsabilidades:
 *  - Validar el DTO de entrada.
 *  - Ensamblar el EngineInput completo (incluyendo historial real desde BD,
 *    en producción vía un repositorio inyectado — aquí queda como TODO
 *    explícito para no inventar una integración de datos que no existe aún).
 *  - Invocar el motor determinista.
 *  - NO contiene lógica de negocio propia: toda decisión vive en src/engine.
 */
let WorkoutEngineService = class WorkoutEngineService {
    generate(dto) {
        const errores = (0, generate_plan_dto_1.validateGeneratePlanDto)(dto);
        if (errores.length > 0) {
            throw new common_1.BadRequestException({ message: 'Datos de entrada inválidos', errores });
        }
        // TODO(fase-1-backend): sustituir por consulta real a
        // RecoveryRecord/WorkoutSession vía Prisma cuando dto.historial no venga
        // informado (por ejemplo, calculando adherencia de las últimas 4-8
        // semanas). Por ahora se respeta lo enviado o se asume usuario nuevo.
        const input = {
            perfil: dto.perfil,
            objetivo: dto.objetivo,
            disponibilidad: dto.disponibilidad,
            equipamientoDisponible: dto.equipamientoDisponible ?? [],
            preferencias: dto.preferencias,
            limitaciones: dto.limitaciones,
            historial: dto.historial ?? null,
        };
        return (0, generatePlan_1.generateWorkoutPlan)(input);
    }
};
exports.WorkoutEngineService = WorkoutEngineService;
exports.WorkoutEngineService = WorkoutEngineService = __decorate([
    (0, common_1.Injectable)()
], WorkoutEngineService);
