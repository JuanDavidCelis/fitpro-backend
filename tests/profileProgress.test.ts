import { UserProfileApplicationService } from '../src/application/UserProfileApplicationService';
import { ProgressApplicationService } from '../src/application/ProgressApplicationService';
import { InMemoryUserProfileRepository } from '../src/persistence/memory/InMemoryUserProfileRepository';
import { InMemoryProgressRepository } from '../src/persistence/memory/InMemoryProgressRepository';

describe('UserProfileApplicationService — perfil completo del usuario', () => {
  it('getProfile devuelve hasProfile=false cuando el usuario nunca completó perfil', async () => {
    const repo = new InMemoryUserProfileRepository();
    const service = new UserProfileApplicationService(repo);

    const res = await service.getProfile('user-1');
    expect(res.hasProfile).toBe(false);
    expect(res.profile).toBeNull();
  });

  it('upsertProfile crea un perfil nuevo con todos los campos', async () => {
    const repo = new InMemoryUserProfileRepository();
    const service = new UserProfileApplicationService(repo);

    const stored = await service.upsertProfile('user-1', {
      edad: 30,
      sexo: 'masculino',
      pesoKg: 75,
      alturaCm: 180,
      nivelExperiencia: 'intermedio',
      lesiones: ['rodilla'],
      dolorActual: [],
      requiereConsulta: false,
      musculosPrioritarios: ['espalda'],
      pesoObjetivoKg: 70,
    });

    expect(stored.edad).toBe(30);
    expect(stored.pesoObjetivoKg).toBe(70);
    expect(stored.lesiones).toEqual(['rodilla']);
    expect(stored.nivelExperiencia).toBe('intermedio');
  });

  it('upsertProfile es idempotente: una segunda llamada actualiza sin duplicar', async () => {
    const repo = new InMemoryUserProfileRepository();
    const service = new UserProfileApplicationService(repo);

    await service.upsertProfile('user-1', {
      edad: 30, sexo: 'masculino', pesoKg: 75, alturaCm: 180,
      nivelExperiencia: 'intermedio', lesiones: [], dolorActual: [],
      requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: null,
    });

    const actualizado = await service.upsertProfile('user-1', {
      pesoKg: 74,
      pesoObjetivoKg: 70,
    });

    expect(actualizado.pesoKg).toBe(74);
    expect(actualizado.edad).toBe(30); // se mantiene del anterior
    expect(actualizado.pesoObjetivoKg).toBe(70);

    const res = await service.getProfile('user-1');
    expect(res.hasProfile).toBe(true);
  });

  it('valida rangos de edad, peso, altura y nivel de experiencia', async () => {
    const repo = new InMemoryUserProfileRepository();
    const service = new UserProfileApplicationService(repo);

    await expect(
      service.upsertProfile('user-1', {
        edad: 10, sexo: 'masculino', pesoKg: 75, alturaCm: 180,
        nivelExperiencia: 'principiante', lesiones: [], dolorActual: [],
        requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: null,
      }),
    ).rejects.toThrow(/edad/);

    await expect(
      service.upsertProfile('user-1', {
        edad: 30, sexo: 'masculino', pesoKg: 0, alturaCm: 180,
        nivelExperiencia: 'principiante', lesiones: [], dolorActual: [],
        requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: null,
      }),
    ).rejects.toThrow(/peso/);

    await expect(
      service.upsertProfile('user-1', {
        edad: 30, sexo: 'masculino', pesoKg: 75, alturaCm: 0,
        nivelExperiencia: 'principiante', lesiones: [], dolorActual: [],
        requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: null,
      }),
    ).rejects.toThrow(/altura/);

    await expect(
      service.upsertProfile('user-1', {
        edad: 30, sexo: 'masculino', pesoKg: 75, alturaCm: 180,
        nivelExperiencia: 'extraterrestre', lesiones: [], dolorActual: [],
        requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: null,
      }),
    ).rejects.toThrow(/experiencia/i);
  });

  it('valida rango de peso objetivo', async () => {
    const repo = new InMemoryUserProfileRepository();
    const service = new UserProfileApplicationService(repo);

    await expect(
      service.upsertProfile('user-1', {
        edad: 30, sexo: 'masculino', pesoKg: 75, alturaCm: 180,
        nivelExperiencia: 'principiante', lesiones: [], dolorActual: [],
        requiereConsulta: false, musculosPrioritarios: [], pesoObjetivoKg: 500,
      }),
    ).rejects.toThrow(/peso objetivo/);
  });
});

describe('ProgressApplicationService — progreso de peso y objetivo', () => {
  it('getProgress sin registros devuelve currentWeightKg=null', async () => {
    const repo = new InMemoryProgressRepository();
    const service = new ProgressApplicationService(repo);

    const res = await service.getProgress('user-1', 70);
    expect(res.records).toEqual([]);
    expect(res.currentWeightKg).toBeNull();
    expect(res.targetWeightKg).toBe(70);
    expect(res.weightDeltaKg).toBeNull();
    expect(res.progressPercent).toBeNull();
  });

  it('getProgress calcula delta y porcentaje correctamente', async () => {
    const repo = new InMemoryProgressRepository();
    const service = new ProgressApplicationService(repo);

    await repo.create('user-1', { pesoKg: 80, fuente: 'manual' });
    await repo.create('user-1', { pesoKg: 78, fuente: 'manual' });

    const res = await service.getProgress('user-1', 70);
    expect(res.currentWeightKg).toBe(78);
    expect(res.targetWeightKg).toBe(70);
    expect(res.weightDeltaKg).toBe(8); // 78 - 70
    // progreso = (1 - 8/78) * 100 ≈ 89.74
    expect(res.progressPercent).toBeCloseTo(89.74, 1);
  });

  it('registerWeight crea un nuevo ProgressRecord', async () => {
    const repo = new InMemoryProgressRepository();
    const service = new ProgressApplicationService(repo);

    const record = await service.registerWeight('user-1', 75, 'manual');
    expect(record.pesoKg).toBe(75);
    expect(record.fuente).toBe('manual');

    const res = await service.getProgress('user-1', 70);
    expect(res.records.length).toBe(1);
    expect(res.currentWeightKg).toBe(75);
  });
});