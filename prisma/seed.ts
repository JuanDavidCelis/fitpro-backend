import { PrismaClient } from '@prisma/client';
import { EXERCISES } from '../src/data/exercises';

/**
 * Siembra la tabla Exercise a partir del catálogo in-memory usado por el
 * motor de reglas (src/data/exercises.ts), para que WorkoutExercise pueda
 * referenciar cada ejercicio por FK. Ejecutar con:
 *   npx ts-node prisma/seed.ts
 * (o configurarlo como `prisma.seed` en package.json una vez el cliente
 * esté generado contra una base de datos real).
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    for (const ex of EXERCISES) {
      await prisma.exercise.upsert({
        where: { id: ex.id },
        update: {
          nombre: ex.nombre,
          grupoPrimario: ex.grupoPrimario,
          gruposSecundarios: ex.gruposSecundarios,
          equipamientoRequerido: ex.equipamientoRequerido,
          nivelMinimo: ex.nivelMinimo,
          patron: ex.patron,
          instrucciones: ex.instrucciones,
          erroresComunes: ex.erroresComunes,
          etiquetas: ex.etiquetas,
          alternativas: ex.alternativas,
        },
        create: {
          id: ex.id,
          nombre: ex.nombre,
          grupoPrimario: ex.grupoPrimario,
          gruposSecundarios: ex.gruposSecundarios,
          equipamientoRequerido: ex.equipamientoRequerido,
          nivelMinimo: ex.nivelMinimo,
          patron: ex.patron,
          instrucciones: ex.instrucciones,
          erroresComunes: ex.erroresComunes,
          etiquetas: ex.etiquetas,
          alternativas: ex.alternativas,
        },
      });
    }
    // eslint-disable-next-line no-console
    console.log(`Seed completo: ${EXERCISES.length} ejercicios.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
