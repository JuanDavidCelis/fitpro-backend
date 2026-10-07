import { Exercise, EngineInput, GrupoMuscular, NivelPrograma } from '../domain/types';
import { EXERCISES, findExercise } from '../data/exercises';

// Orden de progresión de niveles de programa, usado para comparar "nivel <= nivel usuario".
const NIVEL_ORDEN: Record<NivelPrograma, number> = {
  foundation: 0,
  growth: 1,
  advanced: 2,
  olympia: 3,
};

export interface SelectedExercise {
  exercise: Exercise;
  sustituidoDesde: string | null;
  motivoSustitucion: string | null;
}

/**
 * Determina si un ejercicio es elegible dado el equipamiento disponible,
 * el nivel de programa y las limitaciones del usuario.
 */
export function isEligible(
  exercise: Exercise,
  equipamientoDisponible: Set<string>,
  nivelPrograma: NivelPrograma,
  limitaciones: EngineInput['limitaciones'],
): boolean {
  const tieneEquipo = exercise.equipamientoRequerido.every((eq) =>
    equipamientoDisponible.has(eq),
  );
  const nivelOk = NIVEL_ORDEN[exercise.nivelMinimo] <= NIVEL_ORDEN[nivelPrograma];
  const patronExcluido = limitaciones.patronesExcluidos.includes(exercise.patron);
  const excluidoPorId = limitaciones.ejerciciosExcluidosIds.includes(exercise.id);

  return tieneEquipo && nivelOk && !patronExcluido && !excluidoPorId;
}

/**
 * Intenta resolver un ejercicio "ideal" contra las restricciones reales del
 * usuario. Si no es elegible directamente, recorre su cadena de alternativas
 * (sección 21: mantener patrón de movimiento y grupo muscular en lo posible).
 * Devuelve null si ninguna alternativa es viable (se descarta ese slot).
 */
export function resolveExercise(
  idealExerciseId: string,
  input: EngineInput,
  nivelPrograma: NivelPrograma,
  yaUsados: Set<string>,
): SelectedExercise | null {
  const equipamientoDisponible = new Set<string>([
    ...input.equipamientoDisponible,
    'peso_corporal', // siempre disponible
  ]);
  const excluidosPreferencia = new Set(input.preferencias.ejerciciosExcluidosIds);

  const ideal = findExercise(idealExerciseId);
  if (!ideal) return null;

  const candidatos = [ideal.id, ...ideal.alternativas];

  for (const candidatoId of candidatos) {
    if (yaUsados.has(candidatoId)) continue;
    if (excluidosPreferencia.has(candidatoId)) continue;

    const candidato = findExercise(candidatoId);
    if (!candidato) continue;

    if (isEligible(candidato, equipamientoDisponible, nivelPrograma, input.limitaciones)) {
      return {
        exercise: candidato,
        sustituidoDesde: candidato.id === ideal.id ? null : ideal.id,
        motivoSustitucion:
          candidato.id === ideal.id
            ? null
            : `Se sustituyó "${ideal.nombre}" por "${candidato.nombre}" (mismo patrón de movimiento ` +
              `y grupo muscular principal, ajustado a tu equipamiento o limitaciones).`,
      };
    }
  }

  return null;
}

/**
 * Selecciona todos los ejercicios elegibles para un grupo muscular dado,
 * ordenados sin repetir, respetando equipamiento/nivel/limitaciones.
 */
export function candidatesForGroup(
  grupo: GrupoMuscular,
  input: EngineInput,
  nivelPrograma: NivelPrograma,
): Exercise[] {
  const equipamientoDisponible = new Set<string>([
    ...input.equipamientoDisponible,
    'peso_corporal',
  ]);
  const excluidosPreferencia = new Set(input.preferencias.ejerciciosExcluidosIds);

  return EXERCISES.filter(
    (ex) =>
      ex.grupoPrimario === grupo &&
      !excluidosPreferencia.has(ex.id) &&
      isEligible(ex, equipamientoDisponible, nivelPrograma, input.limitaciones),
  );
}
