"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryProgressRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let InMemoryProgressRepository = class InMemoryProgressRepository {
    constructor() {
        this.registros = [];
    }
    async addWeight(userId, pesoKg) {
        const r = { id: (0, crypto_1.randomUUID)(), userId, fecha: new Date(), pesoKg };
        this.registros.push(r);
        return { id: r.id, fecha: r.fecha, pesoKg: r.pesoKg };
    }
    async listWeights(userId, limit) {
        return this.registros
            .filter((r) => r.userId === userId)
            .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
            .slice(-limit)
            .map((r) => ({ id: r.id, fecha: r.fecha, pesoKg: r.pesoKg }));
    }
};
exports.InMemoryProgressRepository = InMemoryProgressRepository;
exports.InMemoryProgressRepository = InMemoryProgressRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryProgressRepository);
