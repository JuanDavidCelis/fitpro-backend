import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WorkoutEngineService } from './workout-engine.service';
import { GeneratePlanDto } from '../dto/generate-plan.dto';
import { WorkoutPlanResult } from '../../domain/types';
// import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard'; // ver auth/ (sección 28)

@Controller('workout-plans')
// @UseGuards(FirebaseAuthGuard) // habilitar cuando el módulo de auth esté integrado
export class WorkoutEngineController {
  constructor(private readonly engineService: WorkoutEngineService) {}

  /**
   * Genera un nuevo plan de entrenamiento (nueva versión). No modifica planes
   * existentes: la persistencia de "versión N, activo=true / desactivar
   * anterior" ocurre en el módulo `plans/` (WorkoutPlan), no aquí. Este
   * endpoint es puro respecto al motor: mismo input, mismo output.
   */
  @Post('generate')
  generate(@Body() dto: GeneratePlanDto): WorkoutPlanResult {
    return this.engineService.generate(dto);
  }
}
