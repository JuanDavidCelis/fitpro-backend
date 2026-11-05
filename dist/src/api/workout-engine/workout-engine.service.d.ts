import { WorkoutPlanResult } from '../../domain/types';
import { GeneratePlanDto } from '../dto/generate-plan.dto';
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
export declare class WorkoutEngineService {
    generate(dto: GeneratePlanDto): WorkoutPlanResult;
}
