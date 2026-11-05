import { WorkoutEngineService } from './workout-engine.service';
import { GeneratePlanDto } from '../dto/generate-plan.dto';
import { WorkoutPlanResult } from '../../domain/types';
export declare class WorkoutEngineController {
    private readonly engineService;
    constructor(engineService: WorkoutEngineService);
    /**
     * Previsualiza un plan SIN guardarlo (no crea versiones). Requiere estar
     * autenticado para que nadie use el motor como cómputo gratuito abierto.
     * La persistencia (versionado) vive en POST /users/:userId/workout-plans/generate.
     */
    generate(dto: GeneratePlanDto): WorkoutPlanResult;
}
