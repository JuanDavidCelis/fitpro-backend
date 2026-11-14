"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserApplicationService = void 0;
const common_1 = require("@nestjs/common");
const NOMBRE_MAX = 60;
class UserApplicationService {
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    /**
     * Crea el perfil de negocio del usuario autenticado, o devuelve el que ya
     * existe. Es idempotente a propósito: iniciar sesión en un teléfono nuevo
     * llama al mismo endpoint sin duplicar ni fallar.
     */
    async registerOrGet(input) {
        const existente = await this.userRepo.findById(input.id);
        if (existente)
            return existente;
        const nombre = this.normalizarNombre(input.nombre, input.email);
        try {
            return await this.userRepo.create({ id: input.id, email: input.email, nombre });
        }
        catch (e) {
            // Dos peticiones simultáneas: la otra pudo crearlo un instante antes.
            const creadoPorOtra = await this.userRepo.findById(input.id);
            if (creadoPorOtra)
                return creadoPorOtra;
            throw e;
        }
    }
    async getById(id) {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new common_1.NotFoundException({ message: `Usuario ${id} no existe`, code: 'USER_NOT_FOUND' });
        }
        return user;
    }
    /**
     * Usado por otros módulos (plans, sessions): un usuario puede estar
     * autenticado en Supabase pero no haber creado aún su perfil aquí.
     */
    async assertExists(id) {
        const existe = await this.userRepo.existsById(id);
        if (!existe) {
            throw new common_1.NotFoundException({ message: `Usuario ${id} no existe. Completa tu registro primero (POST /users).`, code: 'USER_NOT_FOUND' });
        }
    }
    normalizarNombre(nombre, email) {
        if (nombre === undefined || nombre === null) {
            return this.nombrePorDefecto(email);
        }
        if (typeof nombre !== 'string') {
            throw new common_1.BadRequestException('El nombre debe ser texto');
        }
        const limpio = nombre.trim();
        if (limpio.length === 0)
            return this.nombrePorDefecto(email);
        if (limpio.length > NOMBRE_MAX) {
            throw new common_1.BadRequestException(`El nombre es demasiado largo (máximo ${NOMBRE_MAX} caracteres)`);
        }
        return limpio;
    }
    nombrePorDefecto(email) {
        const local = email.split('@')[0]?.trim();
        return local ? local.slice(0, NOMBRE_MAX) : 'Atleta';
    }
}
exports.UserApplicationService = UserApplicationService;
