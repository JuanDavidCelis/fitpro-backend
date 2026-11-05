"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceModule = void 0;
const common_1 = require("@nestjs/common");
const PrismaService_1 = require("./prisma/PrismaService");
const PrismaPlanRepository_1 = require("./prisma/PrismaPlanRepository");
const PrismaSessionRepository_1 = require("./prisma/PrismaSessionRepository");
const PrismaRecoveryRepository_1 = require("./prisma/PrismaRecoveryRepository");
const PrismaUserRepository_1 = require("./prisma/PrismaUserRepository");
const PrismaProfileRepository_1 = require("./prisma/PrismaProfileRepository");
const PrismaProgressRepository_1 = require("./prisma/PrismaProgressRepository");
const InMemoryPlanRepository_1 = require("./memory/InMemoryPlanRepository");
const InMemorySessionRepository_1 = require("./memory/InMemorySessionRepository");
const InMemoryRecoveryRepository_1 = require("./memory/InMemoryRecoveryRepository");
const InMemoryUserRepository_1 = require("./memory/InMemoryUserRepository");
const InMemoryProfileRepository_1 = require("./memory/InMemoryProfileRepository");
const InMemoryProgressRepository_1 = require("./memory/InMemoryProgressRepository");
const tokens_1 = require("./tokens");
// Controlado por variable de entorno para poder correr el backend en modo
// demo/desarrollo sin PostgreSQL (USE_IN_MEMORY_DB=true), y en modo real
// contra Prisma en cualquier otro caso. Ver README para más detalle.
const useInMemory = process.env.USE_IN_MEMORY_DB === 'true';
// IMPORTANTE: PrismaService solo se registra como provider cuando realmente
// se va a usar. Si se declarara siempre (incluso en modo memoria), Nest lo
// instanciaría igualmente por estar en `providers` aunque nada lo inyecte,
// y su constructor (PrismaClient) revienta si el cliente no fue generado
// contra una base de datos real. Esto se detectó en pruebas de arranque
// reales del servidor en modo USE_IN_MEMORY_DB=true.
let PersistenceModule = class PersistenceModule {
};
exports.PersistenceModule = PersistenceModule;
exports.PersistenceModule = PersistenceModule = __decorate([
    (0, common_1.Module)({
        providers: [
            ...(useInMemory ? [] : [PrismaService_1.PrismaService]),
            {
                provide: tokens_1.PLAN_REPOSITORY,
                useClass: useInMemory ? InMemoryPlanRepository_1.InMemoryPlanRepository : PrismaPlanRepository_1.PrismaPlanRepository,
            },
            {
                provide: tokens_1.SESSION_REPOSITORY,
                useClass: useInMemory ? InMemorySessionRepository_1.InMemorySessionRepository : PrismaSessionRepository_1.PrismaSessionRepository,
            },
            {
                provide: tokens_1.RECOVERY_REPOSITORY,
                useClass: useInMemory ? InMemoryRecoveryRepository_1.InMemoryRecoveryRepository : PrismaRecoveryRepository_1.PrismaRecoveryRepository,
            },
            {
                provide: tokens_1.PROFILE_REPOSITORY,
                useClass: useInMemory ? InMemoryProfileRepository_1.InMemoryProfileRepository : PrismaProfileRepository_1.PrismaProfileRepository,
            },
            {
                provide: tokens_1.PROGRESS_REPOSITORY,
                useClass: useInMemory ? InMemoryProgressRepository_1.InMemoryProgressRepository : PrismaProgressRepository_1.PrismaProgressRepository,
            },
            {
                provide: tokens_1.USER_REPOSITORY,
                useClass: useInMemory ? InMemoryUserRepository_1.InMemoryUserRepository : PrismaUserRepository_1.PrismaUserRepository,
            },
        ],
        exports: [tokens_1.PLAN_REPOSITORY, tokens_1.SESSION_REPOSITORY, tokens_1.RECOVERY_REPOSITORY, tokens_1.USER_REPOSITORY, tokens_1.PROFILE_REPOSITORY, tokens_1.PROGRESS_REPOSITORY],
    })
], PersistenceModule);
