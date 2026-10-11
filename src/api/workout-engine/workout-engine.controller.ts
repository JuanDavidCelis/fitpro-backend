import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WorkoutEngineService } from './workout-engine.service';
import { GeneratePlanDto } from '../dto/generate-plan.dto';
import { WorkoutPlanResult } from '../../domain/types';
import { SupabaseAuthGuard } from '../../auth/SupabaseAuthGuard';

@Controller('workout-plans')
@UseGuards(SupabaseAuthGuard)
export class WorkoutEngineController {
  constructor(private readonly engineService: WorkoutEngineService) {}

  /**
   * Previsualiza un plan SIN guardarlo (no crea versiones). Requiere estar
   * autenticado para que nadie use el motor como cómputo gratuito abierto.
   * La persistencia (versionado) vive en POST /users/:userId/workout-plans/generate.
   */
  @Post('generate')
  generate(@Body() dto: GeneratePlanDto): WorkoutPlanResult {
    return this.engineService.generate(dto);
  }
}
