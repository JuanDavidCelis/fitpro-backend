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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const PrismaService_1 = require("./PrismaService");
let PrismaUserRepository = class PrismaUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        try {
            const created = await this.prisma.user.create({
                data: { id: input.id, email: input.email, nombre: input.nombre },
            });
            return { id: created.id, email: created.email, nombre: created.nombre, createdAt: created.createdAt };
        }
        catch (e) {
            if (e?.code === 'P2002') {
                throw new common_1.ConflictException(`Ya existe un usuario con ese id o con el email ${input.email}`);
            }
            throw e;
        }
    }
    async findById(id) {
        const row = await this.prisma.user.findUnique({ where: { id } });
        if (!row)
            return null;
        return { id: row.id, email: row.email, nombre: row.nombre, createdAt: row.createdAt };
    }
    async existsById(id) {
        const row = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
        return row !== null;
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [PrismaService_1.PrismaService])
], PrismaUserRepository);
