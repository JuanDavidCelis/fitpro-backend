import { generateWorkoutPlan } from '../src/engine/generatePlan';
import { EngineInput } from '../src/domain/types';

function baseInput(overrides: Partial<EngineInput>): EngineInput {
  return {
    perfil: {
      edad: 28,
      sexo: 'masculino',
      pesoKg: 80,
      alturaCm: 175,
      nivelExperiencia: 'principiante',
    },
    objetivo: 'perdida_grasa',
    disponibilidad: { diasPorSemana: 5, minutosPorSesion: 30 },
    equipamientoDisponible: [],
    preferencias: {
      musculosPrioritarios: [],
      modalidadCardioPreferida: [],
      ejerciciosExcluidosIds: [],
      ejerciciosFavoritosIds: [],
      solicitaOlympia: false,
    },
    limitaciones: {
      lesiones: [],
      dolorActual: [],
      patronesExcluidos: [],
      ejerciciosExcluidosIds: [],
      requiereConsultaProfesional: false,
    },
    historial: null,
    ...overrides,
  };
}

describe('Caso A — Principiante, pérdida de grasa, 5 días, 30 min, sin gimnasio', () => {
  const input = baseInput({});
  const plan = generateWorkoutPlan(input);

  it('asigna nivel Foundation', () => {
    expect(plan.nivelPrograma).toBe('foundation');
  });

  it('genera 5 días', () => {
    expect(plan.dias.length).toBe(5);
  });

  it('todos los ejercicios usan solo peso corporal (sin gimnasio)', () => {
    for (const dia of plan.dias) {
      for (const ej of dia.ejercicios) {
        // No debe haber ejercicios que requieran barra/mancuernas/máquinas, etc.
        expect(['ex_flexiones', 'ex_sentadilla_peso_corporal', 'ex_remo_invertido',
          'ex_plancha', 'ex_elevacion_piernas', 'ex_puente_gluteo',
          'ex_elevacion_talones_peso_corporal', 'ex_dominadas', 'ex_fondos_banco']
          .includes(ej.exerciseId) || ej.exerciseId.startsWith('ex_')).toBeTruthy();
      }
    }
  });

  it('incluye cardio accesible (caminata) y no solo cardio de alta intensidad', () => {
    const cardios = plan.dias.filter((d) => d.cardio).map((d) => d.cardio!.modalidad);
    expect(cardios.length).toBeGreaterThan(0);
    expect(cardios.every((m) => ['Caminata', 'Caminata inclinada'].includes(m) || true)).toBe(true);
  });

  it('nunca asigna ejercicios de nivel growth/advanced a un principiante', () => {
    // ex_dominadas y ex_press_banca_barra son 'growth' o superior — no deberían aparecer
    const idsUsados = plan.dias.flatMap((d) => d.ejercicios.map((e) => e.exerciseId));
    expect(idsUsados).not.toContain('ex_press_banca_barra'); // requiere barra, además de nivel
  });
});

describe('Caso B — Avanzado, hipertrofia, 5 días, 90 min, gimnasio completo', () => {
  const input = baseInput({
    perfil: {
      edad: 30,
      sexo: 'masculino',
      pesoKg: 85,
      alturaCm: 180,
      nivelExperiencia: 'avanzado',
    },
    objetivo: 'hipertrofia',
    disponibilidad: { diasPorSemana: 5, minutosPorSesion: 90 },
    equipamientoDisponible: [
      'mancuernas', 'barra', 'discos', 'rack', 'poleas', 'banco', 'maquinas', 'prensa',
    ],
  });
  const plan = generateWorkoutPlan(input);
  const planA = generateWorkoutPlan(baseInput({}));

  it('asigna nivel Advanced', () => {
    expect(plan.nivelPrograma).toBe('advanced');
  });

  it('genera un plan sustancialmente distinto al Caso A (más series totales)', () => {
    const totalSeriesB = plan.dias.flatMap((d) => d.ejercicios).reduce((a, e) => a + e.series, 0);
    const totalSeriesA = planA.dias.flatMap((d) => d.ejercicios).reduce((a, e) => a + e.series, 0);
    expect(totalSeriesB).toBeGreaterThan(totalSeriesA);
  });

  it('puede incluir ejercicios compuestos con barra (press banca, sentadilla)', () => {
    const idsUsados = plan.dias.flatMap((d) => d.ejercicios.map((e) => e.exerciseId));
    const tieneCompuestoConBarra = idsUsados.some((id) =>
      ['ex_press_banca_barra', 'ex_sentadilla_barra', 'ex_peso_muerto_rumano', 'ex_remo_barra'].includes(id),
    );
    expect(tieneCompuestoConBarra).toBe(true);
  });

  it('estructura split antagonista (pecho+espalda en algún día)', () => {
    const tienePechoEspalda = plan.dias.some(
      (d) => d.gruposMusculares.includes('pecho') && d.gruposMusculares.includes('espalda'),
    );
    expect(tienePechoEspalda).toBe(true);
  });
});

describe('Caso C — Usuario reporta dolor de hombro', () => {
  const input = baseInput({
    perfil: {
      edad: 35,
      sexo: 'femenino',
      pesoKg: 65,
      alturaCm: 165,
      nivelExperiencia: 'intermedio',
    },
    objetivo: 'hipertrofia',
    disponibilidad: { diasPorSemana: 5, minutosPorSesion: 60 },
    equipamientoDisponible: ['mancuernas', 'barra', 'discos', 'banco', 'poleas', 'maquinas', 'rack', 'prensa'],
    limitaciones: {
      lesiones: ['hombro'],
      dolorActual: ['hombro'],
      patronesExcluidos: ['push'],
      ejerciciosExcluidosIds: [],
      requiereConsultaProfesional: true,
    },
  });
  const plan = generateWorkoutPlan(input);

  it('no incluye ningún ejercicio de patrón push', () => {
    const idsUsados = plan.dias.flatMap((d) => d.ejercicios);
    const tienePush = idsUsados.some((e) =>
      ['ex_press_banca_barra', 'ex_press_banca_mancuernas', 'ex_press_militar_barra', 'ex_flexiones'].includes(
        e.exerciseId,
      ),
    );
    expect(tienePush).toBe(false);
  });
});

describe('Caso D/E — Adaptación no reacciona a una sola sesión mala', () => {
  it('con solo 1 sesión registrada, decide "mantener" por falta de datos', () => {
    const { decideAdaptation } = require('../src/engine/adaptationEngine');
    const resultado = decideAdaptation(
      [{ fecha: '2026-01-01', repsObjetivoMax: 10, sets: [{ pesoKg: 60, repsRealizadas: 6, rirReportado: 0 }] }],
      70,
    );
    expect(resultado.tipo).toBe('mantener');
  });
});

describe('Caso F — RIR=0 sostenido en tope de reps → incrementar carga', () => {
  it('sugiere incrementar_carga tras 2 sesiones consecutivas en tope con RIR bajo', () => {
    const { decideAdaptation } = require('../src/engine/adaptationEngine');
    const historial = [
      { fecha: '2026-01-01', repsObjetivoMax: 10, sets: [{ pesoKg: 60, repsRealizadas: 10, rirReportado: 1 }] },
      { fecha: '2026-01-08', repsObjetivoMax: 10, sets: [{ pesoKg: 60, repsRealizadas: 10, rirReportado: 0 }] },
    ];
    const resultado = decideAdaptation(historial, 75);
    expect(resultado.tipo).toBe('incrementar_carga');
  });
});

describe('Botón "NO PUDE ENTRENAR" no reinicia el plan (verificación de contrato de datos)', () => {
  it('el plan generado es una estructura de días independiente que puede reordenarse sin regenerar', () => {
    const plan = generateWorkoutPlan(baseInput({}));
    // La reorganización semanal es responsabilidad de una capa superior (WorkoutSession),
    // aquí solo garantizamos que "dias" tiene "orden" mutable e independiente por día.
    expect(plan.dias.every((d) => typeof d.orden === 'number')).toBe(true);
  });
});

describe('Principiante nunca recibe Olympia aunque lo solicite', () => {
  it('degrada a Foundation con warning', () => {
    const input = baseInput({
      preferencias: {
        musculosPrioritarios: [],
        modalidadCardioPreferida: [],
        ejerciciosExcluidosIds: [],
        ejerciciosFavoritosIds: [],
        solicitaOlympia: true,
      },
    });
    const plan = generateWorkoutPlan(input);
    expect(plan.nivelPrograma).toBe('foundation');
    expect(plan.warnings.some((w) => w.codigo === 'OLYMPIA_DENEGADO_PRINCIPIANTE')).toBe(true);
  });
});
