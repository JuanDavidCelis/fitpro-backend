"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRESS_REPOSITORY = exports.PROFILE_REPOSITORY = exports.USER_REPOSITORY = exports.RECOVERY_REPOSITORY = exports.SESSION_REPOSITORY = exports.PLAN_REPOSITORY = void 0;
// Tokens de DI: NestJS no puede inyectar por interfaz TypeScript directamente
// (se borra en tiempo de compilación), así que se usan estos símbolos como
// llave de binding en los módulos.
exports.PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
exports.SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
exports.RECOVERY_REPOSITORY = Symbol('RECOVERY_REPOSITORY');
exports.USER_REPOSITORY = Symbol('USER_REPOSITORY');
exports.PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
exports.PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');
