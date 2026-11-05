import {
  EngineInput,
  NivelPrograma,
  EngineWarning,
} from '../domain/types';

export interface LevelSelectionResult {
  nivelPrograma: NivelPrograma;
  nivelSolicitado: NivelPrograma | null;
  warnings: EngineWarning[];
  trace: string[];
}

// Umbrales mínimos, conservadores, para desbloquear niveles superiores.
// No son "mágicos": son valores de arranque, ajustables desde configuración
// del backend sin tocar el resto del motor.
const SEMANAS_MIN_PARA_ADVANCED = 12;
const ADHERENCIA_MIN_PARA_ADVANCED = 0.75;
const RECOVERY_MIN_PARA_OLYMPIA = 65;
const DIAS_MIN_PARA_OLYMPIA = 6;
// Olympia exige historial REAL: sin registros de recuperación todavía, el "score"
// es un valor neutro por defecto y no debe bastar para desbloquear un programa de alta exigencia.
const SEMANAS_MIN_PARA_OLYMPIA = 8;

/**
 * REGLA DURA: un usuario principiante NUNCA recibe Advanced u Olympia,
 * sin excepción, independientemente de lo que solicite.
 */
export function selectProgramLevel(input: EngineInput): LevelSelectionResult {
  const trace: string[] = [];
  const warnings: EngineWarning[] = [];
  const { nivelExperiencia } = input.perfil;
  const historial = input.historial;

  if (nivelExperiencia === 'principiante') {
    trace.push(
      'Nivel de experiencia = principiante → nivel de programa forzado a Foundation (regla dura, sin excepciones).',
    );
    if (input.preferencias.solicitaOlympia) {
      warnings.push({
        codigo: 'OLYMPIA_DENEGADO_PRINCIPIANTE',
        mensaje:
          'Solicitaste el nivel Olympia/Elite, pero tu experiencia actual es principiante. ' +
          'Por seguridad, empezamos en Foundation e iremos desbloqueando niveles según tu progreso real.',
      });
    }
    return { nivelPrograma: 'foundation', nivelSolicitado: null, warnings, trace };
  }

  if (nivelExperiencia === 'intermedio') {
    const puedeAvanzarAdvanced =
      historial !== null &&
      historial.semanasEntrenando >= SEMANAS_MIN_PARA_ADVANCED &&
      historial.adherenciaUltimasSemanas >= ADHERENCIA_MIN_PARA_ADVANCED &&
      historial.tendenciaRendimiento !== 'bajando';

    if (puedeAvanzarAdvanced) {
      trace.push(
        `Nivel intermedio con ${historial!.semanasEntrenando} semanas de historial y adherencia ` +
          `${(historial!.adherenciaUltimasSemanas * 100).toFixed(0)}% → se habilita Advanced.`,
      );
      return { nivelPrograma: 'advanced', nivelSolicitado: null, warnings, trace };
    }

    trace.push(
      'Nivel de experiencia = intermedio, sin historial suficiente para Advanced → nivel de programa: Growth.',
    );
    return { nivelPrograma: 'growth', nivelSolicitado: null, warnings, trace };
  }

  // avanzado
  if (input.preferencias.solicitaOlympia) {
    const cumpleOlympia =
      historial !== null &&
      historial.semanasEntrenando >= SEMANAS_MIN_PARA_OLYMPIA &&
      historial.recoveryScorePromedio >= RECOVERY_MIN_PARA_OLYMPIA &&
      input.disponibilidad.diasPorSemana >= DIAS_MIN_PARA_OLYMPIA &&
      historial.tendenciaRendimiento !== 'bajando';

    if (cumpleOlympia) {
      trace.push(
        'Nivel avanzado + solicitud explícita de Olympia + recovery score y disponibilidad suficientes → Olympia habilitado.',
      );
      return { nivelPrograma: 'olympia', nivelSolicitado: null, warnings, trace };
    }

    trace.push(
      'Solicitaste Olympia pero no se cumplen los requisitos (≥ 8 semanas entrenando, disponibilidad, recovery score o tendencia de rendimiento) → se degrada a Advanced.',
    );
    warnings.push({
      codigo: 'OLYMPIA_DEGRADADO_A_ADVANCED',
      mensaje:
        `El nivel Olympia requiere al menos ${SEMANAS_MIN_PARA_OLYMPIA} semanas entrenando, ${DIAS_MIN_PARA_OLYMPIA} días/semana, un recovery score ` +
        `promedio ≥ ${RECOVERY_MIN_PARA_OLYMPIA}/100 y una tendencia de rendimiento estable o positiva. ` +
        'Por ahora te damos un programa Advanced; podrás optar a Olympia cuando se cumplan esas condiciones.',
    });
    return { nivelPrograma: 'advanced', nivelSolicitado: 'olympia', warnings, trace };
  }

  trace.push('Nivel de experiencia = avanzado → nivel de programa: Advanced.');
  return { nivelPrograma: 'advanced', nivelSolicitado: null, warnings, trace };
}
