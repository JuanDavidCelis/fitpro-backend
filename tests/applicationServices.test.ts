import { PlanApplicationService } from '../src/application/PlanApplicationService';
import { SessionApplicationService } from '../src/application/SessionApplicationService';
import { InMemoryPlanRepository } from '../src/persistence/memory/InMemoryPlanRepository';
import { InMemorySessionRepository } from '../src/persistence/memory/InMemorySessionRepository';
import { InMemoryRecoveryRepository } from '../src/persistence/memory/InMemoryRecoveryRepository';
import { EngineInput } from '../src/domain/types';

function basePartialInput(): Omit<EngineInput, 'historial'> {
  return {
    perfil: { edad: 25, sexo: 'masculino', pesoKg: 80, alturaCm: 178, nivelExperiencia: 'principiante' },
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
  };
}

describe('PlanApplicationService — versionado de planes (persistencia)', () => {
  it('crea la versión 1 como activa la primera vez', async () => {
    const planRepo = new InMemoryPlanRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const service = new PlanApplicationService(planRepo, recoveryRepo);

    const stored = await service.generateAndPersist('user-1', basePartialInput());

    expect(stored.version).toBe(1);
    expect(stored.activo).toBe(true);
  });

  it('al regenerar, crea la versión 2 y desactiva la versión 1 (nunca muta el plan existente)', async () => {
    const planRepo = new InMemoryPlanRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const service = new PlanApplicationService(planRepo, recoveryRepo);

    const v1 = await service.generateAndPersist('user-1', basePartialInput());
    const v2 = await service.generateAndPersist('user-1', basePartialInput());

    const historial = await service.getVersionHistory('user-1');
    const v1Actualizado = historial.find((p) => p.id === v1.id)!;

    expect(v2.version).toBe(2);
    expect(v2.activo).toBe(true);
    expect(v1Actualizado.activo).toBe(false);
    expect(historial.length).toBe(2);
  });

  it('getActivePlan devuelve siempre la última versión activa', async () => {
    const planRepo = new InMemoryPlanRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const service = new PlanApplicationService(planRepo, recoveryRepo);

    await service.generateAndPersist('user-1', basePartialInput());
    const v2 = await service.generateAndPersist('user-1', basePartialInput());

    const activo = await service.getActivePlan('user-1');
    expect(activo?.id).toBe(v2.id);
  });

  it('usuarios distintos no interfieren entre sí', async () => {
    const planRepo = new InMemoryPlanRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const service = new PlanApplicationService(planRepo, recoveryRepo);

    await service.generateAndPersist('user-A', basePartialInput());
    await service.generateAndPersist('user-B', basePartialInput());

    const activoA = await service.getActivePlan('user-A');
    const activoB = await service.getActivePlan('user-B');

    expect(activoA?.version).toBe(1);
    expect(activoB?.version).toBe(1);
    expect(activoA?.id).not.toBe(activoB?.id);
  });
});

describe('SessionApplicationService — registro de series y adaptación con datos reales', () => {
  // Estos tests ejercitan decideAdaptationForExercise directamente sobre
  // sesiones creadas a bajo nivel (sessionRepo.startSession), sin pasar por
  // service.startSession (que exige un plan activo real) — eso se prueba
  // aparte, más abajo, en el bloque "ciclo completo".
  function buildService() {
    const sessionRepo = new InMemorySessionRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const planRepo = new InMemoryPlanRepository();
    const service = new SessionApplicationService(sessionRepo, recoveryRepo, planRepo);
    return { sessionRepo, recoveryRepo, planRepo, service };
  }

  it('registra series y decide "mantener" cuando aún no hay suficientes sesiones', async () => {
    const { sessionRepo, service } = buildService();
    const sesion = await sessionRepo.startSession({ userId: 'user-1', workoutDayId: 'day-x' });

    await service.logSet({
      sessionId: sesion.id,
      userId: 'user-1',
      exerciseId: 'ex_press_banca_barra',
      numeroSerie: 1,
      pesoKg: 60,
      repsRealizadas: 8,
      rirReportado: 2,
      repsObjetivoMax: 10,
    });

    const decision = await service.decideAdaptationForExercise('user-1', 'ex_press_banca_barra');
    expect(decision.tipo).toBe('mantener');
  });

  it('sugiere incrementar_carga tras 2 sesiones reales consecutivas en tope de reps con RIR bajo', async () => {
    const { sessionRepo, recoveryRepo, service } = buildService();
    recoveryRepo.add('user-1', 80);

    // Sesión 1 (simulada como más antigua): 3 series en tope de reps, RIR bajo.
    const sesion1 = await sessionRepo.startSession({ userId: 'user-1', workoutDayId: 'day-x' });
    for (let serie = 1; serie <= 3; serie++) {
      await service.logSet({
        sessionId: sesion1.id,
        userId: 'user-1',
        exerciseId: 'ex_sentadilla_barra',
        numeroSerie: serie,
        pesoKg: 60,
        repsRealizadas: 10,
        rirReportado: 1,
        repsObjetivoMax: 10,
      });
    }
    // Pequeña espera para asegurar orden de fecha distinto entre sesiones.
    await new Promise((r) => setTimeout(r, 5));

    // Sesión 2 (más reciente): igual patrón.
    const sesion2 = await sessionRepo.startSession({ userId: 'user-1', workoutDayId: 'day-x' });
    for (let serie = 1; serie <= 3; serie++) {
      await service.logSet({
        sessionId: sesion2.id,
        userId: 'user-1',
        exerciseId: 'ex_sentadilla_barra',
        numeroSerie: serie,
        pesoKg: 60,
        repsRealizadas: 10,
        rirReportado: 0,
        repsObjetivoMax: 10,
      });
    }

    const decision = await service.decideAdaptationForExercise('user-1', 'ex_sentadilla_barra');
    expect(decision.tipo).toBe('incrementar_carga');
  });

  it('no mezcla el historial de dos usuarios distintos para el mismo ejercicio', async () => {
    const { sessionRepo, service } = buildService();
    const sesionA = await sessionRepo.startSession({ userId: 'user-A', workoutDayId: 'day-x' });

    await service.logSet({
      sessionId: sesionA.id,
      userId: 'user-A',
      exerciseId: 'ex_curl_mancuerna',
      numeroSerie: 1,
      pesoKg: 12,
      repsRealizadas: 12,
      rirReportado: 0,
      repsObjetivoMax: 12,
    });

    const decisionB = await service.decideAdaptationForExercise('user-B', 'ex_curl_mancuerna');
    // user-B no tiene ningún registro -> debe decidir "mantener" por falta de datos,
    // nunca heredar el historial de user-A.
    expect(decisionB.tipo).toBe('mantener');
  });
});

describe('SessionApplicationService — ciclo completo iniciar/registrar/finalizar (botón INICIAR ENTRENAMIENTO)', () => {
  async function buildServiceConPlanActivo() {
    const sessionRepo = new InMemorySessionRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const planRepo = new InMemoryPlanRepository();
    const planService = new PlanApplicationService(planRepo, recoveryRepo);
    const sessionService = new SessionApplicationService(sessionRepo, recoveryRepo, planRepo);

    const stored = await planService.generateAndPersist('user-1', basePartialInput());
    return { sessionRepo, recoveryRepo, planRepo, sessionService, stored };
  }

  it('inicia una sesión sobre un día real del plan activo', async () => {
    const { sessionService, stored } = await buildServiceConPlanActivo();
    const primerDia = stored.plan.dias[0];

    const sesion = await sessionService.startSession('user-1', primerDia.orden);

    expect(sesion.workoutDayId).toBe(primerDia.id);
    expect(sesion.estado).toBe('en_progreso');
  });

  it('rechaza iniciar sesión sobre un día que no existe en el plan activo', async () => {
    const { sessionService } = await buildServiceConPlanActivo();
    await expect(sessionService.startSession('user-1', 999)).rejects.toThrow();
  });

  it('rechaza iniciar sesión si el usuario no tiene ningún plan activo', async () => {
    const sessionRepo = new InMemorySessionRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const planRepo = new InMemoryPlanRepository();
    const sessionService = new SessionApplicationService(sessionRepo, recoveryRepo, planRepo);

    await expect(sessionService.startSession('usuario-sin-plan', 1)).rejects.toThrow();
  });

  it('finishSession calcula correctamente peso total, series y repeticiones a partir de lo persistido', async () => {
    const { sessionService, stored } = await buildServiceConPlanActivo();
    const primerDia = stored.plan.dias[0];
    const primerEjercicio = primerDia.ejercicios[0];

    const sesion = await sessionService.startSession('user-1', primerDia.orden);

    await sessionService.logSet({
      sessionId: sesion.id,
      userId: 'user-1',
      exerciseId: primerEjercicio.exerciseId,
      numeroSerie: 1,
      pesoKg: 10,
      repsRealizadas: 12,
      rirReportado: 2,
      repsObjetivoMax: 15,
    });
    await sessionService.logSet({
      sessionId: sesion.id,
      userId: 'user-1',
      exerciseId: primerEjercicio.exerciseId,
      numeroSerie: 2,
      pesoKg: 12,
      repsRealizadas: 10,
      rirReportado: 1,
      repsObjetivoMax: 15,
    });

    const resumen = await sessionService.finishSession({
      sessionId: sesion.id,
      userId: 'user-1',
      duracionRealSeg: 1800,
    });

    // 10*12 + 12*10 = 120 + 120 = 240
    expect(resumen.volumenTotalKg).toBe(240);
    expect(resumen.totalSeries).toBe(2);
    expect(resumen.totalRepeticiones).toBe(22);
    expect(resumen.ejerciciosRealizados).toBe(1);
    expect(resumen.duracionRealSeg).toBe(1800);
    expect(resumen.estado).toBe('completada');
  });

  it('finishSession sin ninguna serie registrada da estado "parcial" y volumen 0', async () => {
    const { sessionService, stored } = await buildServiceConPlanActivo();
    const primerDia = stored.plan.dias[0];
    const sesion = await sessionService.startSession('user-1', primerDia.orden);

    const resumen = await sessionService.finishSession({
      sessionId: sesion.id,
      userId: 'user-1',
      duracionRealSeg: 60,
    });

    expect(resumen.estado).toBe('parcial');
    expect(resumen.volumenTotalKg).toBe(0);
    expect(resumen.totalSeries).toBe(0);
  });
});

describe('Retención de historial en la nube (plan gratuito de Supabase)', () => {
  it('conserva como máximo las últimas 8 sesiones por ejercicio, poda el resto al finalizar', async () => {
    const sessionRepo = new InMemorySessionRepository();
    const recoveryRepo = new InMemoryRecoveryRepository();
    const planRepo = new InMemoryPlanRepository();
    const service = new SessionApplicationService(sessionRepo, recoveryRepo, planRepo);
    const exerciseId = 'ex_curl_mancuerna';

    // 10 sesiones consecutivas con 1 serie cada una del mismo ejercicio.
    for (let i = 0; i < 10; i++) {
      const sesion = await sessionRepo.startSession({ userId: 'user-1', workoutDayId: 'day-x' });
      await service.logSet({
        sessionId: sesion.id,
        userId: 'user-1',
        exerciseId,
        numeroSerie: 1,
        pesoKg: 10 + i, // peso distinto por sesión para poder identificar cuáles sobrevivieron
        repsRealizadas: 10,
        rirReportado: 2,
        repsObjetivoMax: 12,
      });
      await service.finishSession({ sessionId: sesion.id, userId: 'user-1', duracionRealSeg: 600 });
      await new Promise((r) => setTimeout(r, 2)); // asegurar orden de fecha distinto
    }

    const historial = await sessionRepo.findRecentSessionLogs('user-1', exerciseId, 20);
    // Aunque se pidan hasta 20, la poda ya dejó como máximo 8 sesiones en el repositorio.
    expect(historial.length).toBeLessThanOrEqual(8);
    // Las que sobreviven deben ser las más recientes (pesos más altos: 12..19).
    const pesosSobrevivientes = historial.map((h) => h.sets[0].pesoKg).sort((a, b) => a - b);
    expect(pesosSobrevivientes[0]).toBeGreaterThanOrEqual(12);
  });
});
