import { StoredPlan } from '../persistence/ports/repositories';
/**
 * Agrega a cada ejercicio la URL de su imagen/GIF (si existe). Se hace al
 * RESPONDER y no al guardar: así, cambiar de proveedor o apagar las imágenes
 * no obliga a tocar los planes ya guardados.
 */
export declare function withMedia(stored: StoredPlan): StoredPlan;
