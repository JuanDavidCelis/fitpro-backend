export interface ExerciseMedia {
    datasetId: string;
    image: string;
    gif: string;
}
export declare const MEDIA_ATTRIBUTION = "\u00A9 Gym visual \u2014 https://gymvisual.com/";
export declare const EXERCISE_MEDIA: Record<string, ExerciseMedia>;
/**
 * Base de las URLs. EXERCISE_MEDIA_BASE_URL:
 *  - sin definir  -> CDN de jsDelivr sobre el repo público (por defecto)
 *  - ""  (vacío)  -> imágenes DESACTIVADAS (interruptor de emergencia/licencia)
 *  - otra URL     -> p. ej. tu propio bucket cuando tengas licencia
 */
export declare function mediaBaseUrl(): string | null;
export declare function mediaUrls(exerciseId: string, base?: string | null): {
    imagenUrl: string | null;
    gifUrl: string | null;
};
