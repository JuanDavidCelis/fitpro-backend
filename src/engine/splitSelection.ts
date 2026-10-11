import { EngineInput, GrupoMuscular, NivelPrograma } from '../domain/types';

export interface DayTemplate {
  orden: number;
  nombre: string;
  gruposMusculares: GrupoMuscular[];
  incluyeCardio: boolean;
}

export interface SplitResult {
  dias: DayTemplate[];
  trace: string[];
}

/**
 * Selecciona una plantilla de división semanal según objetivo, días
 * disponibles, nivel y minutos por sesión. NO es una tabla única fija:
 * se construye combinando reglas, tal como exige el documento de diseño
 * (sección 6): "el motor NO debe limitarse a utilizar esta distribución
 * siempre".
 */
export function selectSplit(input: EngineInput): SplitResult {
  const trace: string[] = [];
  const dias = input.disponibilidad.diasPorSemana;
  const sesionCorta = input.disponibilidad.minutosPorSesion < 40;

  if (input.objetivo === 'perdida_grasa') {
    return buildFatLossSplit(dias, sesionCorta, trace);
  }
  return buildHypertrophySplit(dias, sesionCorta, trace);
}

function buildFatLossSplit(
  dias: number,
  sesionCorta: boolean,
  trace: string[],
): SplitResult {
  trace.push(
    `Objetivo pérdida de grasa con ${dias} días disponibles → se prioriza combinar fuerza full/upper-lower con cardio, ` +
      'no una estrategia basada solo en cardio (regla de diseño, sección 3).',
  );

  const plantillas: Record<number, DayTemplate[]> = {
    2: [
      { orden: 1, nombre: 'Full body + cardio', gruposMusculares: fullBody(), incluyeCardio: true },
      { orden: 2, nombre: 'Full body + cardio', gruposMusculares: fullBody(), incluyeCardio: true },
    ],
    3: [
      { orden: 1, nombre: 'Full body + cardio', gruposMusculares: fullBody(), incluyeCardio: true },
      { orden: 2, nombre: 'Full body + cardio', gruposMusculares: fullBody(), incluyeCardio: true },
      { orden: 3, nombre: 'Full body + cardio', gruposMusculares: fullBody(), incluyeCardio: true },
    ],
    4: [
      { orden: 1, nombre: 'Tren superior + cardio', gruposMusculares: upperBody(), incluyeCardio: true },
      { orden: 2, nombre: 'Tren inferior + cardio', gruposMusculares: lowerBody(), incluyeCardio: true },
      { orden: 3, nombre: 'Tren superior + cardio', gruposMusculares: upperBody(), incluyeCardio: true },
      { orden: 4, nombre: 'Tren inferior + cardio', gruposMusculares: lowerBody(), incluyeCardio: true },
    ],
    5: [
      { orden: 1, nombre: 'Fuerza tren superior', gruposMusculares: upperBody(), incluyeCardio: false },
      { orden: 2, nombre: 'Cardio + core', gruposMusculares: ['abdomen', 'cardio'], incluyeCardio: true },
      { orden: 3, nombre: 'Fuerza tren inferior', gruposMusculares: lowerBody(), incluyeCardio: false },
      { orden: 4, nombre: 'Cardio + core', gruposMusculares: ['abdomen', 'cardio'], incluyeCardio: true },
      { orden: 5, nombre: 'Full body + cardio moderado', gruposMusculares: fullBody(), incluyeCardio: true },
    ],
    6: [
      { orden: 1, nombre: 'Fuerza tren superior', gruposMusculares: upperBody(), incluyeCardio: false },
      { orden: 2, nombre: 'Cardio', gruposMusculares: ['cardio'], incluyeCardio: true },
      { orden: 3, nombre: 'Fuerza tren inferior', gruposMusculares: lowerBody(), incluyeCardio: false },
      { orden: 4, nombre: 'Cardio + core', gruposMusculares: ['abdomen', 'cardio'], incluyeCardio: true },
      { orden: 5, nombre: 'Full body', gruposMusculares: fullBody(), incluyeCardio: false },
      { orden: 6, nombre: 'Cardio moderado', gruposMusculares: ['cardio'], incluyeCardio: true },
    ],
  };

  const dc = Math.min(Math.max(dias, 2), 6);
  if (dc !== dias) {
    trace.push(`Días solicitados (${dias}) fuera de rango soportado; se ajusta a ${dc}.`);
  }
  let seleccion = plantillas[dc];

  if (sesionCorta) {
    trace.push('Duración de sesión < 40 min → se reduce el número de grupos musculares por día.');
    seleccion = seleccion.map((d) => ({ ...d, gruposMusculares: d.gruposMusculares.slice(0, 3) }));
  }

  return { dias: seleccion, trace };
}

function buildHypertrophySplit(
  dias: number,
  sesionCorta: boolean,
  trace: string[],
): SplitResult {
  trace.push(
    `Objetivo hipertrofia con ${dias} días disponibles → se evalúa split antagonista como estrategia ` +
      'de programación eficiente (no como "la mejor" de forma universal, sección 5).',
  );

  const plantillas: Record<number, DayTemplate[]> = {
    3: [
      { orden: 1, nombre: 'Empuje (pecho/hombro/tríceps)', gruposMusculares: ['pecho', 'hombros', 'triceps'], incluyeCardio: false },
      { orden: 2, nombre: 'Tirón (espalda/bíceps)', gruposMusculares: ['espalda', 'biceps', 'antebrazo'], incluyeCardio: false },
      { orden: 3, nombre: 'Pierna completa', gruposMusculares: ['cuadriceps', 'femoral', 'gluteos', 'pantorrilla'], incluyeCardio: false },
    ],
    4: [
      { orden: 1, nombre: 'Pecho + espalda', gruposMusculares: ['pecho', 'espalda'], incluyeCardio: false },
      { orden: 2, nombre: 'Pierna', gruposMusculares: ['cuadriceps', 'femoral', 'gluteos', 'pantorrilla'], incluyeCardio: false },
      { orden: 3, nombre: 'Hombros + brazos', gruposMusculares: ['hombros', 'biceps', 'triceps', 'antebrazo'], incluyeCardio: false },
      { orden: 4, nombre: 'Full body / prioritarios', gruposMusculares: fullBody(), incluyeCardio: false },
    ],
    5: [
      { orden: 1, nombre: 'Pecho + espalda', gruposMusculares: ['pecho', 'espalda'], incluyeCardio: false },
      { orden: 2, nombre: 'Bíceps + tríceps + antebrazo', gruposMusculares: ['biceps', 'triceps', 'antebrazo'], incluyeCardio: false },
      { orden: 3, nombre: 'Pierna', gruposMusculares: ['cuadriceps', 'femoral', 'gluteos', 'pantorrilla'], incluyeCardio: false },
      { orden: 4, nombre: 'Pecho + espalda + hombros', gruposMusculares: ['pecho', 'espalda', 'hombros'], incluyeCardio: false },
      { orden: 5, nombre: 'Pierna + brazos / prioritarios', gruposMusculares: ['cuadriceps', 'femoral', 'biceps', 'triceps'], incluyeCardio: false },
    ],
    6: [
      { orden: 1, nombre: 'Pecho + espalda', gruposMusculares: ['pecho', 'espalda'], incluyeCardio: false },
      { orden: 2, nombre: 'Pierna (cuádriceps dominante)', gruposMusculares: ['cuadriceps', 'gluteos', 'pantorrilla'], incluyeCardio: false },
      { orden: 3, nombre: 'Hombros + brazos', gruposMusculares: ['hombros', 'biceps', 'triceps', 'antebrazo'], incluyeCardio: false },
      { orden: 4, nombre: 'Pecho + espalda (variación)', gruposMusculares: ['pecho', 'espalda'], incluyeCardio: false },
      { orden: 5, nombre: 'Pierna (femoral dominante)', gruposMusculares: ['femoral', 'gluteos', 'pantorrilla'], incluyeCardio: false },
      { orden: 6, nombre: 'Brazos + prioritarios', gruposMusculares: ['biceps', 'triceps', 'antebrazo'], incluyeCardio: false },
    ],
  };

  const dc = dias <= 3 ? 3 : dias >= 6 ? 6 : dias === 4 ? 4 : 5;
  if (dc !== dias) {
    trace.push(`Días solicitados (${dias}) mapeados a plantilla de ${dc} días disponible.`);
  }
  let seleccion = plantillas[dc];

  if (sesionCorta) {
    trace.push('Duración de sesión < 40 min → se reduce el número de grupos musculares por día.');
    seleccion = seleccion.map((d) => ({ ...d, gruposMusculares: d.gruposMusculares.slice(0, 2) }));
  }

  return { dias: seleccion, trace };
}

function fullBody(): GrupoMuscular[] {
  return ['pecho', 'espalda', 'cuadriceps', 'femoral', 'hombros', 'abdomen'];
}
function upperBody(): GrupoMuscular[] {
  return ['pecho', 'espalda', 'hombros', 'biceps', 'triceps'];
}
function lowerBody(): GrupoMuscular[] {
  return ['cuadriceps', 'femoral', 'gluteos', 'pantorrilla', 'abdomen'];
}
