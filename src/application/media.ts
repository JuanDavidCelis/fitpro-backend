import { mediaBaseUrl, mediaUrls } from '../data/exerciseMedia';
import { StoredPlan } from '../persistence/ports/repositories';

/**
 * Agrega a cada ejercicio la URL de su imagen/GIF (si existe). Se hace al
 * RESPONDER y no al guardar: así, cambiar de proveedor o apagar las imágenes
 * no obliga a tocar los planes ya guardados.
 */
export function withMedia(stored: StoredPlan): StoredPlan {
  const base = mediaBaseUrl();
  return {
    ...stored,
    plan: {
      ...stored.plan,
      dias: stored.plan.dias.map((d) => ({
        ...d,
        ejercicios: d.ejercicios.map((e) => ({ ...e, ...mediaUrls(e.exerciseId, base) })),
      })),
    },
  };
}
