import { Injectable, BadRequestException } from '@nestjs/common';
import { generateWorkoutPlan } from '../../engine/generatePlan';
import { EngineInput, WorkoutPlanResult } from '../../domain/types';
import { GeneratePlanDto, validateGeneratePlanDto } from '../dto/generate-plan.dto';

/**
 * Capa de aplicación entre el controller HTTP y el Rules Engine puro.
 * Responsabilidades:
 *  - Validar el DTO de entrada.
 *  - Ensamblar el EngineInput completo (incluyendo historial real desde BD,
 *    en producción vía un repositorio inyectado — aquí queda como TODO
 *    explícito para no inventar una integración de datos que no existe aún).
 *  - Invocar el motor determinista.
 *  - NO contiene lógica de negocio propia: toda decisión vive en src/engine.
 */
@Injectable()
export class WorkoutEngineService {
  generate(dto: GeneratePlanDto): WorkoutPlanResult {
    const errores = validateGeneratePlanDto(dto);
    if (errores.length > 0) {
      throw new BadRequestException({ message: 'Datos de entrada inválidos', errores });
    }

    // TODO(fase-1-backend): sustituir por consulta real a
    // RecoveryRecord/WorkoutSession vía Prisma cuando dto.historial no venga
    // informado (por ejemplo, calculando adherencia de las últimas 4-8
    // semanas). Por ahora se respeta lo enviado o se asume usuario nuevo.
    const input: EngineInput = {
      perfil: dto.perfil,
      objetivo: dto.objetivo,
      disponibilidad: dto.disponibilidad,
      equipamientoDisponible: dto.equipamientoDisponible ?? [],
      preferencias: dto.preferencias,
      limitaciones: dto.limitaciones,
      historial: dto.historial ?? null,
    };

    return generateWorkoutPlan(input);
  }
}
