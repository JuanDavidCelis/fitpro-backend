/**
 * DTO de entrada del endpoint POST /users/:userId/workout-plans/substitute-exercise.
 * Permite sustituir un ejercicio por otro que trabaje el mismo grupo muscular.
 */
export class SubstituteExerciseDto {
  workoutDayId!: string;
  oldExerciseId!: string;
  newExerciseId!: string;
  motivo!: string;
}

export function validateSubstituteExerciseDto(dto: SubstituteExerciseDto): string[] {
  const errores: string[] = [];

  if (!dto.workoutDayId?.trim()) errores.push('workoutDayId es obligatorio');
  if (!dto.oldExerciseId?.trim()) errores.push('oldExerciseId es obligatorio');
  if (!dto.newExerciseId?.trim()) errores.push('newExerciseId es obligatorio');
  if (!dto.motivo?.trim()) errores.push('motivo es obligatorio');

  return errores;
}