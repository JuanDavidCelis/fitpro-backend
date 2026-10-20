import { PlanApplicationService } from '../src/application/PlanApplicationService';
import { SessionApplicationService } from '../src/application/SessionApplicationService';
import { InMemoryPlanRepository } from '../src/persistence/memory/InMemoryPlanRepository';
import { InMemorySessionRepository } from '../src/persistence/memory/InMemorySessionRepository';
import { InMemoryRecoveryRepository } from '../src/persistence/memory/InMemoryRecoveryRepository';
import { EngineInput } from '../src/domain/types';

function partialInput(dias = 5): Omit<EngineInput, 'historial'> {
  return {
    perfil: { edad: 25, sexo: 'masculino', pesoKg: 80, alturaCm: 178, nivelExperiencia: 'principiante' },
    objetivo: 'perdida_grasa',
    disponibilidad: { diasPorSemana: dias, minutosPorSesion: 30 },
    equipamientoDisponible: [],
    preferencias: {
      musculosPrioritarios: [], modalidadCardioPreferida: [], ejerciciosExcluidosIds: [],
      ejerciciosFavoritosIds: [], solicitaOlympia: false,
    },
    limitaciones: {
      lesiones: [], dolorActual: [], patronesExcluidos: [], ejerciciosExcluidosIds: [],
      requiereConsultaProfesional: false,
    },
  };
}

async function setup() {
  const sessionRepo = new InMemorySessionRepository();
  const recoveryRepo = new InMemoryRecoveryRepository();
  const planRepo = new InMemoryPlanRepository();
  const planService = new PlanApplicationService(planRepo, recoveryRepo);
  const service = new SessionApplicationService(sessionRepo, recoveryRepo, planRepo);
  return { service, planService, sessionRepo };
}

/** Entrena el día indicado: inicia, registra 1 serie y finaliza como "completada". */
async function completarDia(service: SessionApplicationService, userId: string, diaOrden: number, exerciseId: string) {
  const s = await service.startSession(userId, diaOrden);
  await service.logSet({
    sessionId: s.id, userId, exerciseId, numeroSerie: 1, pesoKg: 10, repsRealizadas: 10,
    rirReportado: 2, repsObjetivoMax: 15,
  });
  await service.finishSession({ sessionId: s.id, userId, duracionRealSeg: 600, estado: 'completada' });
}

describe('logSet idempotente (reintentos sin duplicar series)', () => {
  it('enviar la misma serie dos veces cuenta UNA sola serie y conserva el último valor', async () => {
    const { service, planService } = await setup();
    const plan = await planService.generateAndPersist('u1', partialInput());
    const ej = plan.plan.dias[0].ejercicios[0];
    const s = await service.startSession('u1', 1);

    const base = {
      sessionId: s.id, userId: 'u1', exerciseId: ej.exerciseId, numeroSerie: 1,
      rirReportado: 2, repsObjetivoMax: 15,
    };
    await service.logSet({ ...base, pesoKg: 10, repsRealizadas: 10 });
    await service.logSet({ ...base, pesoKg: 10, repsRealizadas: 10 }); // reintento tras corte de red
    await service.logSet({ ...base, pesoKg: 12, repsRealizadas: 8 });  // corrección del mismo número de serie

    const r = await service.finishSession({ sessionId: s.id, userId: 'u1', duracionRealSeg: 300 });
    expect(r.totalSeries).toBe(1);
    expect(r.volumenTotalKg).toBe(12 * 8);
  });

  it('series con distinto número SÍ se acumulan', async () => {
    const { service, planService } = await setup();
    const plan = await planService.generateAndPersist('u1', partialInput());
    const ej = plan.plan.dias[0].ejercicios[0];
    const s = await service.startSession('u1', 1);
    for (const n of [1, 2, 3]) {
      await service.logSet({
        sessionId: s.id, userId: 'u1', exerciseId: ej.exerciseId, numeroSerie: n,
        pesoKg: 10, repsRealizadas: 10, rirReportado: 2, repsObjetivoMax: 15,
      });
    }
    const r = await service.finishSession({ sessionId: s.id, userId: 'u1', duracionRealSeg: 300 });
    expect(r.totalSeries).toBe(3);
  });
});

describe('Próxima sesión (GET sessions/next)', () => {
  it('sin entrenamientos previos toca el día 1', async () => {
    const { service, planService } = await setup();
    await planService.generateAndPersist('u1', partialInput());
    expect(await service.getNextSession('u1')).toEqual({ diaOrden: 1, ultimoDiaOrden: null, ultimaFecha: null });
  });

  it('al completar el día 1 pasa al día 2, luego al 3...', async () => {
    const { service, planService } = await setup();
    const plan = await planService.generateAndPersist('u1', partialInput());
    const ejercicioDe = (orden: number) => plan.plan.dias.find((d) => d.orden === orden)!.ejercicios[0]?.exerciseId ?? 'ex_plancha';

    await completarDia(service, 'u1', 1, ejercicioDe(1));
    expect((await service.getNextSession('u1')).diaOrden).toBe(2);

    await new Promise((r) => setTimeout(r, 3));
    await completarDia(service, 'u1', 2, ejercicioDe(2));
    const n = await service.getNextSession('u1');
    expect(n.diaOrden).toBe(3);
    expect(n.ultimoDiaOrden).toBe(2);
    expect(n.ultimaFecha).not.toBeNull();
  });

  it('después del último día vuelve al día 1', async () => {
    const { service, planService } = await setup();
    const plan = await planService.generateAndPersist('u1', partialInput(3));
    const total = plan.plan.dias.length;
    const ej = (o: number) => plan.plan.dias.find((d) => d.orden === o)!.ejercicios[0]?.exerciseId ?? 'ex_plancha';
    for (let o = 1; o <= total; o++) {
      await completarDia(service, 'u1', o, ej(o));
      await new Promise((r) => setTimeout(r, 3));
    }
    expect((await service.getNextSession('u1')).diaOrden).toBe(1);
  });

  it('una sesión sin series (estado parcial) NO avanza la rotación', async () => {
    const { service, planService } = await setup();
    await planService.generateAndPersist('u1', partialInput());
    const s = await service.startSession('u1', 1);
    await service.finishSession({ sessionId: s.id, userId: 'u1', duracionRealSeg: 20, estado: 'parcial' });
    expect((await service.getNextSession('u1')).diaOrden).toBe(1);
  });

  it('al regenerar el plan se reinicia en el día 1 (las sesiones del plan viejo no cuentan)', async () => {
    const { service, planService } = await setup();
    const v1 = await planService.generateAndPersist('u1', partialInput());
    await completarDia(service, 'u1', 1, v1.plan.dias[0].ejercicios[0].exerciseId);
    expect((await service.getNextSession('u1')).diaOrden).toBe(2);

    await planService.generateAndPersist('u1', partialInput()); // v2
    expect((await service.getNextSession('u1')).diaOrden).toBe(1);
  });

  it('no mezcla usuarios', async () => {
    const { service, planService } = await setup();
    const a = await planService.generateAndPersist('a', partialInput());
    await planService.generateAndPersist('b', partialInput());
    await completarDia(service, 'a', 1, a.plan.dias[0].ejercicios[0].exerciseId);
    expect((await service.getNextSession('a')).diaOrden).toBe(2);
    expect((await service.getNextSession('b')).diaOrden).toBe(1);
  });

  it('sin plan activo responde 404', async () => {
    const { service } = await setup();
    await expect(service.getNextSession('nadie')).rejects.toThrow(/plan activo/);
  });
});
