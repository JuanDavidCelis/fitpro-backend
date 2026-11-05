import { EngineInput, NivelPrograma, EngineWarning } from '../domain/types';
export interface LevelSelectionResult {
    nivelPrograma: NivelPrograma;
    nivelSolicitado: NivelPrograma | null;
    warnings: EngineWarning[];
    trace: string[];
}
/**
 * REGLA DURA: un usuario principiante NUNCA recibe Advanced u Olympia,
 * sin excepción, independientemente de lo que solicite.
 */
export declare function selectProgramLevel(input: EngineInput): LevelSelectionResult;
