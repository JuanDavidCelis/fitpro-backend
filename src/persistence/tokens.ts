// Tokens de DI: NestJS no puede inyectar por interfaz TypeScript directamente
// (se borra en tiempo de compilación), así que se usan estos símbolos como
// llave de binding en los módulos.
export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export const RECOVERY_REPOSITORY = Symbol('RECOVERY_REPOSITORY');
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
