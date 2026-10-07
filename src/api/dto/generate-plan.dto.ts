import {
  Equipamiento,
  GrupoMuscular,
  NivelExperiencia,
  ObjetivoTipo,
  PatronMovimiento,
} from '../../domain/types';

/**
 * DTO de entrada del endpoint POST /workout-plans/generate.
 * Se valida explícitamente (sin confiar en "any") antes de construir el
 * EngineInput que consume el Rules Engine.
 */
export class GeneratePlanDto {
  perfil!: {
    edad: number;
    sexo: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
    pesoKg: number;
    alturaCm: number;
    nivelExperiencia: NivelExperiencia;
  };
  objetivo!: ObjetivoTipo;
  disponibilidad!: {
    diasPorSemana: number;
    minutosPorSesion: number;
  };
  equipamientoDisponible!: Equipamiento[];
  preferencias!: {
    musculosPrioritarios: GrupoMuscular[];
    modalidadCardioPreferida: string[];
    ejerciciosExcluidosIds: string[];
    ejerciciosFavoritosIds: string[];
    solicitaOlympia: boolean;
  };
  limitaciones!: {
    lesiones: string[];
    dolorActual: string[];
    patronesExcluidos: PatronMovimiento[];
    ejerciciosExcluidosIds: string[];
    requiereConsultaProfesional: boolean;
  };
  // El historial de rendimiento NO lo envía el cliente: lo calcula el backend
  // a partir de WorkoutSession/RecoveryRecord. Se incluye aquí como opcional
  // solo para poder testear el endpoint de forma aislada.
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
export function validateGeneratePlanDto(dto: GeneratePlanDto): string[] {
  const errores: string[] = [];

  if (!dto.perfil) errores.push('perfil es obligatorio');
  else {
    if (dto.perfil.edad < 14 || dto.perfil.edad > 90) {
      errores.push('edad fuera de rango soportado (14-90). Para menores, se recomienda supervisión de un profesional.');
    }
    if (dto.perfil.pesoKg <= 0 || dto.perfil.pesoKg > 400) errores.push('pesoKg inválido');
    if (dto.perfil.alturaCm <= 0 || dto.perfil.alturaCm > 260) errores.push('alturaCm inválido');
  }

  if (!dto.disponibilidad) errores.push('disponibilidad es obligatoria');
  else {
    if (dto.disponibilidad.diasPorSemana < 1 || dto.disponibilidad.diasPorSemana > 7) {
      errores.push('diasPorSemana debe estar entre 1 y 7');
    }
    if (dto.disponibilidad.minutosPorSesion < 10 || dto.disponibilidad.minutosPorSesion > 180) {
      errores.push('minutosPorSesion debe estar entre 10 y 180');
    }
  }

  if (dto.preferencias?.musculosPrioritarios?.length > 2) {
    errores.push('máximo 2 músculos prioritarios simultáneos');
  }

  return errores;
}
