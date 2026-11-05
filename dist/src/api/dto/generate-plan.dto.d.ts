import { Equipamiento, GrupoMuscular, NivelExperiencia, ObjetivoTipo, PatronMovimiento } from '../../domain/types';
/**
 * DTO de entrada del endpoint POST /workout-plans/generate.
 * Se valida explícitamente (sin confiar en "any") antes de construir el
 * EngineInput que consume el Rules Engine.
 */
export declare class GeneratePlanDto {
    perfil: {
        edad: number;
        sexo: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
        pesoKg: number;
        alturaCm: number;
        nivelExperiencia: NivelExperiencia;
    };
    objetivo: ObjetivoTipo;
    disponibilidad: {
        diasPorSemana: number;
        minutosPorSesion: number;
    };
    equipamientoDisponible: Equipamiento[];
    preferencias: {
        musculosPrioritarios: GrupoMuscular[];
        modalidadCardioPreferida: string[];
        ejerciciosExcluidosIds: string[];
        ejerciciosFavoritosIds: string[];
        solicitaOlympia: boolean;
    };
    limitaciones: {
        lesiones: string[];
        dolorActual: string[];
        patronesExcluidos: PatronMovimiento[];
        ejerciciosExcluidosIds: string[];
        requiereConsultaProfesional: boolean;
    };
    historial?: {
        semanasEntrenando: number;
        adherenciaUltimasSemanas: number;
        recoveryScorePromedio: number;
        rirPromedioReciente: number | null;
        tendenciaRendimiento: 'subiendo' | 'estable' | 'bajando' | 'sin_datos';
    } | null;
}
/**
 * Validación mínima de reglas de negocio sobre el DTO, previa a invocar el
 * motor. Lanza errores descriptivos en vez de dejar pasar datos inválidos.
 */
export declare function validateGeneratePlanDto(dto: GeneratePlanDto): string[];
