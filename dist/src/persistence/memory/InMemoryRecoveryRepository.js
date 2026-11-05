"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryRecoveryRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryRecoveryRepository = class InMemoryRecoveryRepository {
    constructor() {
        this.records = [];
    }
    add(userId, recoveryScore) {
        this.records.push({ userId, recoveryScore, fecha: new Date() });
    }
    async averageRecentRecoveryScore(userId, ultimosNRegistros) {
        const propios = this.records
            .filter((r) => r.userId === userId)
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
            .slice(0, ultimosNRegistros);
        if (propios.length === 0)
            return 70; // valor neutro por defecto sin datos
        return propios.reduce((acc, r) => acc + r.recoveryScore, 0) / propios.length;
    }
};
exports.InMemoryRecoveryRepository = InMemoryRecoveryRepository;
exports.InMemoryRecoveryRepository = InMemoryRecoveryRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryRecoveryRepository);
