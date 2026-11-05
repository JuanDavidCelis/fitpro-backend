"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryProfileRepository = void 0;
const common_1 = require("@nestjs/common");
let InMemoryProfileRepository = class InMemoryProfileRepository {
    constructor() {
        this.perfiles = new Map();
    }
    async findByUser(userId) {
        const p = this.perfiles.get(userId);
        return p ? structuredClone(p) : null;
    }
    async save(userId, settings) {
        this.perfiles.set(userId, structuredClone(settings));
        return structuredClone(settings);
    }
    async updateCurrentWeight(userId, pesoKg) {
        const p = this.perfiles.get(userId);
        if (p)
            p.pesoKg = pesoKg;
    }
};
exports.InMemoryProfileRepository = InMemoryProfileRepository;
exports.InMemoryProfileRepository = InMemoryProfileRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryProfileRepository);
