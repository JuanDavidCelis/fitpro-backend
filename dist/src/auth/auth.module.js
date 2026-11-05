"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
exports.buildAuthVerifier = buildAuthVerifier;
const common_1 = require("@nestjs/common");
const tokens_1 = require("./tokens");
const FakeAuthTokenVerifier_1 = require("./FakeAuthTokenVerifier");
const SupabaseJwtVerifier_1 = require("./SupabaseJwtVerifier");
const SupabaseAuthGuard_1 = require("./SupabaseAuthGuard");
const SameUserGuard_1 = require("./SameUserGuard");
function isProduction() {
    return process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
}
function wantsFakeAuth() {
    const flag = process.env.USE_FAKE_AUTH;
    // Por comodidad en local, si no se define USE_FAKE_AUTH sigue a USE_IN_MEMORY_DB.
    return flag === 'true' || (flag === undefined && process.env.USE_IN_MEMORY_DB === 'true');
}
/**
 * Elige el verificador de tokens:
 *  - Producción (Vercel / NODE_ENV=production): SIEMPRE Supabase. El login
 *    falso se ignora aunque alguien deje USE_FAKE_AUTH=true por error.
 *  - Desarrollo local: puede usarse el verificador falso (tokens "fake:uid:email").
 */
function buildAuthVerifier() {
    const logger = new common_1.Logger('AuthModule');
    if (wantsFakeAuth()) {
        if (isProduction()) {
            logger.warn('USE_FAKE_AUTH=true IGNORADO en producción: se usa Supabase Auth. ' +
                'Puedes borrar esa variable de entorno.');
        }
        else {
            logger.warn('Auth FALSA activa (solo desarrollo local). No usar en producción.');
            return new FakeAuthTokenVerifier_1.FakeAuthTokenVerifier();
        }
    }
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error('Falta la variable de entorno SUPABASE_URL (https://<project-ref>.supabase.co). ' +
            'Defínela en Vercel → Settings → Environment Variables.');
    }
    return new SupabaseJwtVerifier_1.SupabaseJwtVerifier({
        supabaseUrl,
        jwtSecret: process.env.SUPABASE_JWT_SECRET || undefined,
    });
}
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        providers: [
            { provide: tokens_1.AUTH_TOKEN_VERIFIER, useFactory: buildAuthVerifier },
            SupabaseAuthGuard_1.SupabaseAuthGuard,
            SameUserGuard_1.SameUserGuard,
        ],
        exports: [tokens_1.AUTH_TOKEN_VERIFIER, SupabaseAuthGuard_1.SupabaseAuthGuard, SameUserGuard_1.SameUserGuard],
    })
], AuthModule);
