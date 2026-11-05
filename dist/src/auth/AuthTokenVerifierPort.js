"use strict";
// ============================================================================
// Puerto de autenticación (arquitectura hexagonal, mismo patrón que
// persistence/ports). El guard y el resto de la app dependen SOLO de esta
// interfaz, nunca directamente de una librería JWT concreta. Esto permite testear el
// guard con un verificador falso, determinista, sin credenciales reales.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
