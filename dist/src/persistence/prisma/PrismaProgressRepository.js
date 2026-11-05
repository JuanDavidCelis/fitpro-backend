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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProgressRepository = void 0;
const common_1 = require("@nestjs/common");
const PrismaService_1 = require("./PrismaService");
/** Registros de peso en la tabla ProgressRecord (filas pequeñas: ~1 por mes por usuario). */
let PrismaProgressRepository = class PrismaProgressRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addWeight(userId, pesoKg) {
        const r = await this.prisma.progressRecord.create({ data: { userId, pesoKg, fuente: 'manual' } });
        return { id: r.id, fecha: r.fecha, pesoKg: r.pesoKg };
    }
    async listWeights(userId, limit) {
        // Se piden los más recientes y se devuelven en orden cronológico.
        const rows = await this.prisma.progressRecord.findMany({
            where: { userId, pesoKg: { not: null } },
            orderBy: { fecha: 'desc' },
            take: limit,
        });
        return rows.reverse().map((r) => ({ id: r.id, fecha: r.fecha, pesoKg: r.pesoKg }));
    }
};
exports.PrismaProgressRepository = PrismaProgressRepository;
exports.PrismaProgressRepository = PrismaProgressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PrismaService_1.PrismaService])
], PrismaProgressRepository);
