import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/PrismaService';
import { PrismaPlanRepository } from './prisma/PrismaPlanRepository';
import { PrismaSessionRepository } from './prisma/PrismaSessionRepository';
import { PrismaRecoveryRepository } from './prisma/PrismaRecoveryRepository';
import { PrismaUserRepository } from './prisma/PrismaUserRepository';
import { InMemoryPlanRepository } from './memory/InMemoryPlanRepository';
import { InMemorySessionRepository } from './memory/InMemorySessionRepository';
import { InMemoryRecoveryRepository } from './memory/InMemoryRecoveryRepository';
import { InMemoryUserRepository } from './memory/InMemoryUserRepository';
import { PLAN_REPOSITORY, RECOVERY_REPOSITORY, SESSION_REPOSITORY, USER_REPOSITORY } from './tokens';

// Controlado por variable de entorno para poder correr el backend en modo
// demo/desarrollo sin PostgreSQL (USE_IN_MEMORY_DB=true), y en modo real
// contra Prisma en cualquier otro caso. Ver README para más detalle.
const useInMemory = process.env.USE_IN_MEMORY_DB === 'true';

// IMPORTANTE: PrismaService solo se registra como provider cuando realmente
// se va a usar. Si se declarara siempre (incluso en modo memoria), Nest lo
// instanciaría igualmente por estar en `providers` aunque nada lo inyecte,
// y su constructor (PrismaClient) revienta si el cliente no fue generado
// contra una base de datos real. Esto se detectó en pruebas de arranque
// reales del servidor en modo USE_IN_MEMORY_DB=true.
@Module({
  providers: [
    ...(useInMemory ? [] : [PrismaService]),
    {
      provide: PLAN_REPOSITORY,
      useClass: useInMemory ? InMemoryPlanRepository : PrismaPlanRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useClass: useInMemory ? InMemorySessionRepository : PrismaSessionRepository,
    },
    {
      provide: RECOVERY_REPOSITORY,
      useClass: useInMemory ? InMemoryRecoveryRepository : PrismaRecoveryRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: useInMemory ? InMemoryUserRepository : PrismaUserRepository,
    },
  ],
  exports: [PLAN_REPOSITORY, SESSION_REPOSITORY, RECOVERY_REPOSITORY, USER_REPOSITORY],
})
export class PersistenceModule {}
