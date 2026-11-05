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
exports.PrismaProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const PrismaService_1 = require("./PrismaService");
const arr = (v) => (Array.isArray(v) ? v : []);
function toSettings(r) {
    return {
        edad: r.edad,
        sexo: r.sexo,
        pesoKg: r.pesoKg,
        alturaCm: r.alturaCm,
        nivelExperiencia: r.nivelExperiencia,
        objetivo: r.objetivo,
        diasPorSemana: r.diasPorSemana,
        minutosPorSesion: r.minutosPorSesion,
        equipamiento: arr(r.equipamiento),
        pesoObjetivoKg: r.pesoObjetivoKg ?? null,
        lesiones: arr(r.lesiones),
        dolorActual: arr(r.dolorActual),
        condicionMedica: r.condicionMedica === true,
        musculosPrioritarios: arr(r.musculosPrioritarios),
    };
}
/** Lee/escribe la tabla UserProfile (1 fila por usuario). */
let PrismaProfileRepository = class PrismaProfileRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUser(userId) {
        const row = await this.prisma.userProfile.findUnique({ where: { userId } });
        return row ? toSettings(row) : null;
    }
    async save(userId, s) {
        const data = {
            edad: s.edad,
            sexo: s.sexo,
            pesoKg: s.pesoKg,
            alturaCm: s.alturaCm,
            nivelExperiencia: s.nivelExperiencia,
            objetivo: s.objetivo,
            diasPorSemana: s.diasPorSemana,
            minutosPorSesion: s.minutosPorSesion,
            equipamiento: s.equipamiento,
            pesoObjetivoKg: s.pesoObjetivoKg,
            lesiones: s.lesiones,
            dolorActual: s.dolorActual,
            condicionMedica: s.condicionMedica,
            // Derivado: dolor actual o condición médica => recomendar consulta profesional.
            requiereConsulta: s.condicionMedica || s.dolorActual.length > 0,
            musculosPrioritarios: s.musculosPrioritarios,
        };
        const row = await this.prisma.userProfile.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
        return toSettings(row);
    }
    async updateCurrentWeight(userId, pesoKg) {
        await this.prisma.userProfile.updateMany({ where: { userId }, data: { pesoKg } });
    }
};
exports.PrismaProfileRepository = PrismaProfileRepository;
exports.PrismaProfileRepository = PrismaProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PrismaService_1.PrismaService])
], PrismaProfileRepository);
