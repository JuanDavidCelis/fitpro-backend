/**
 * DTO de entrada del endpoint POST /users/:userId/progress/weight.
 * Valida explícitamente el peso antes de pasarlo al servicio de aplicación.
 */
export class AddWeightRequestDto {
  pesoKg!: number;
}

export function validateAddWeightDto(dto: AddWeightRequestDto): string[] {
  const errores: string[] = [];
  if (
    typeof dto.pesoKg !== 'number' ||
    !Number.isFinite(dto.pesoKg) ||
    dto.pesoKg < 20 ||
    dto.pesoKg > 400
  ) {
    errores.push('pesoKg debe ser un número entre 20 y 400 kg.');
  }
  return errores;
}
