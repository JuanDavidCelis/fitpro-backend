import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * ⚠️ NOTA DE ESTADO: en el entorno de desarrollo donde se escribió este
 * código no fue posible ejecutar `prisma generate` contra una base de datos
 * real (restricción de red del sandbox al binario del query engine). Por lo
 * tanto, aunque este archivo tipa correctamente contra el `schema.prisma`
 * del proyecto, NO ha sido validado en ejecución contra PostgreSQL.
 * Antes de desplegar: ejecutar `npx prisma generate` y `npx prisma db push`
 * (o `migrate dev`) con un DATABASE_URL real, y correr
 * tests/prismaRepositories.integration.test.ts (a crear, ver roadmap).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
