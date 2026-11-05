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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const tokens_1 = require("./tokens");
/**
 * Responde "¿quién eres, de verdad?": extrae `Authorization: Bearer <jwt>`,
 * lo verifica contra el puerto inyectado (Supabase en producción) y adjunta
 * la identidad verificada como `req.user`. La autorización (¿puedes tocar
 * ESTE recurso?) la decide SameUserGuard.
 */
let SupabaseAuthGuard = class SupabaseAuthGuard {
    constructor(verifier) {
        this.verifier = verifier;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const header = request.headers?.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Falta el header Authorization: Bearer <token>');
        }
        const token = header.slice('Bearer '.length).trim();
        const identity = await this.verifier.verify(token);
        request.user = identity;
        return true;
    }
};
exports.SupabaseAuthGuard = SupabaseAuthGuard;
exports.SupabaseAuthGuard = SupabaseAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_1.AUTH_TOKEN_VERIFIER)),
    __metadata("design:paramtypes", [Object])
], SupabaseAuthGuard);
