import { CardioBlockPlan, EngineInput, Equipamiento } from '../domain/types';

interface CardioOption {
  modalidad: string;
  exerciseId: string;
  requiere: Equipamiento[];
  impacto: 'bajo' | 'alto';
  nivelMinimo: 'foundation' | 'growth';
}

const OPCIONES_CARDIO: CardioOption[] = [
  { modalidad: 'Caminata', exerciseId: 'ex_caminata', requiere: ['peso_corporal'], impacto: 'bajo', nivelMinimo: 'foundation' },
  { modalidad: 'Caminata inclinada', exerciseId: 'ex_caminata_inclinada', requiere: ['caminadora'], impacto: 'bajo', nivelMinimo: 'foundation' },
  { modalidad: 'Bicicleta', exerciseId: 'ex_bicicleta', requiere: ['bicicleta'], impacto: 'bajo', nivelMinimo: 'foundation' },
  { modalidad: 'Elíptica', exerciseId: 'ex_eliptica', requiere: ['eliptica'], impacto: 'bajo', nivelMinimo: 'foundation' },
  { modalidad: 'Remo ergómetro', exerciseId: 'ex_remo_cardio', requiere: ['remo_ergometro'], impacto: 'bajo', nivelMinimo: 'growth' },
  { modalidad: 'Carrera', exerciseId: 'ex_carrera', requiere: ['caminadora'], impacto: 'alto', nivelMinimo: 'growth' },
  { modalidad: 'Intervalos', exerciseId: 'ex_intervalos', requiere: ['peso_corporal'], impacto: 'alto', nivelMinimo: 'growth' },
];

/**
 * Sub-reglas de cardio (sección 7.1 del documento de diseño). No existe un
 * "mejor" cardio universal: la elección depende de nivel, peso, tiempo,
 * equipamiento, preferencias y recuperación reciente.
 */
export function selectCardio(
  input: EngineInput,
  nivelPrograma: 'foundation' | 'growth' | 'advanced' | 'olympia',
  minutosDisponibles: number,
): CardioBlockPlan | null {
  const equipamientoDisponible = new Set<string>([...input.equipamientoDisponible, 'peso_corporal']);
  const preferencias = new Set(input.preferencias.modalidadCardioPreferida.map((p) => p.toLowerCase()));
  const recoveryBajo = (input.historial?.recoveryScorePromedio ?? 100) < 50;
  const nivelAltoSuficiente = nivelPrograma !== 'foundation';

  const elegibles = OPCIONES_CARDIO.filter((op) => {
    const tieneEquipo = op.requiere.every((r) => equipamientoDisponible.has(r));
    const nivelOk = op.nivelMinimo === 'foundation' || nivelAltoSuficiente;
    const impactoOk = !recoveryBajo || op.impacto === 'bajo';
    return tieneEquipo && nivelOk && impactoOk;
  });

  if (elegibles.length === 0) return null;

  // Preferencia explícita del usuario, si es compatible.
  const preferido = elegibles.find((op) => preferencias.has(op.modalidad.toLowerCase()));
  const elegido = preferido ?? elegibles[0];

  let intensidad: CardioBlockPlan['intensidad'] = 'moderada';
  if (elegido.modalidad === 'Intervalos') intensidad = 'intervalos';
  else if (recoveryBajo) intensidad = 'baja';
  else if (elegido.impacto === 'alto') intensidad = 'alta';

  const motivoPartes: string[] = [];
  if (preferido) motivoPartes.push('preferencia del usuario');
  if (recoveryBajo) motivoPartes.push('recovery score reciente bajo → se prioriza bajo impacto/intensidad');
  if (!nivelAltoSuficiente) motivoPartes.push('nivel principiante → modalidades de bajo impacto');
  if (motivoPartes.length === 0) motivoPartes.push('modalidad sostenible disponible con el equipamiento actual');

  return {
    modalidad: elegido.modalidad,
    duracionMin: Math.max(10, Math.min(minutosDisponibles, elegido.modalidad === 'Intervalos' ? 20 : 30)),
    intensidad,
    motivo: motivoPartes.join('; '),
  };
}
