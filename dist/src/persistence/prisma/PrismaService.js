"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
/**
 * ⚠️ NOTA DE ESTADO: en el entorno de desarrollo donde se escribió este
 * código no fue posible ejecutar `prisma generate` contra una base de datos
 * real (restricción de red del sandbox al binario del query engine). Por lo
 * tanto, aunque este archivo tipa correctamente contra el `schema.prisma`
 * del proyecto, NO ha sido validado en ejecución contra PostgreSQL.
 * Antes de desplegar: ejecutar `npx prisma generate` y `npx prisma db push`
 * (o `migrate dev`) con un DATABASE_URL real, y correr
 * tests/prismaRepositories.integration.test.ts (a crear, ver roadmap).
 */
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
