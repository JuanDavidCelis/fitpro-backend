"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMedia = withMedia;
const exerciseMedia_1 = require("../data/exerciseMedia");
/**
 * Agrega a cada ejercicio la URL de su imagen/GIF (si existe). Se hace al
 * RESPONDER y no al guardar: así, cambiar de proveedor o apagar las imágenes
 * no obliga a tocar los planes ya guardados.
 */
function withMedia(stored) {
    const base = (0, exerciseMedia_1.mediaBaseUrl)();
    return {
        ...stored,
        plan: {
            ...stored.plan,
            dias: stored.plan.dias.map((d) => ({
                ...d,
                ejercicios: d.ejercicios.map((e) => ({ ...e, ...(0, exerciseMedia_1.mediaUrls)(e.exerciseId, base) })),
            })),
        },
    };
}
