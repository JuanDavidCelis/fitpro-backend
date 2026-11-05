"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryUserRepository = class InMemoryUserRepository {
    constructor() {
        this.users = [];
    }
    async create(input) {
        if (this.users.some((u) => u.id === input.id)) {
            throw new common_1.ConflictException(`Ya existe un usuario con el id ${input.id}`);
        }
        if (this.users.some((u) => u.email === input.email)) {
            throw new common_1.ConflictException(`Ya existe un usuario con el email ${input.email}`);
        }
        const nuevo = {
            id: input.id,
            email: input.email,
            nombre: input.nombre,
            createdAt: new Date(),
        };
        this.users.push(nuevo);
        return nuevo;
    }
    async findById(id) {
        return this.users.find((u) => u.id === id) ?? null;
    }
    async existsById(id) {
        return this.users.some((u) => u.id === id);
    }
};
exports.InMemoryUserRepository = InMemoryUserRepository;
exports.InMemoryUserRepository = InMemoryUserRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryUserRepository);
