"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeAuthTokenVerifier = void 0;
const common_1 = require("@nestjs/common");
/**
 * Verificador determinista para desarrollo local y tests, activado con
 * USE_IN_MEMORY_DB=true (mismo flag que ya controla memoria vs Prisma, para
 * mantener un único "modo demo" coherente en todo el backend).
 *
 * Convención del token falso: "fake:<uid>:<email>". Esto NO es seguro y
 * jamás debe activarse en producción; solo existe para poder probar el
 * comportamiento real del guard (401/403) sin depender de un proyecto
 * Supabase Auth real.
 */
let FakeAuthTokenVerifier = class FakeAuthTokenVerifier {
    async verify(idToken) {
        const partes = idToken.split(':');
        if (partes.length < 2 || partes[0] !== 'fake') {
            throw new common_1.UnauthorizedException('Token de autenticación inválido o expirado');
        }
        return { uid: partes[1], email: partes[2] ?? null };
    }
};
exports.FakeAuthTokenVerifier = FakeAuthTokenVerifier;
exports.FakeAuthTokenVerifier = FakeAuthTokenVerifier = __decorate([
    (0, common_1.Injectable)()
], FakeAuthTokenVerifier);
