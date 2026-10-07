// ============================================================================
// FitPro — Tipos de dominio del Rules Engine
// Estos tipos son la traducción directa del modelo de datos del documento
// de diseño (sección 5) a TypeScript. El motor NUNCA trabaja con tipos "any";
// toda decisión debe ser trazable a un campo concreto de estos tipos.
// ============================================================================

export type NivelExperiencia = 'principiante' | 'intermedio' | 'avanzado';

export type NivelPrograma = 'foundation' | 'growth' | 'advanced' | 'olympia';

export type ObjetivoTipo = 'perdida_grasa' | 'hipertrofia';

export type PatronMovimiento =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'carry'
  | 'core'
  | 'cardio';

export type GrupoMuscular =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazo'
  | 'abdomen'
  | 'gluteos'
  | 'cuadriceps'
  | 'femoral'
  | 'pantorrilla'
  | 'cardio';

export type Equipamiento =
  | 'mancuernas'
  | 'barra'
  | 'discos'
  | 'rack'
  | 'poleas'
  | 'banco'
  | 'maquinas'
  | 'smith'
  | 'prensa'
  | 'bicicleta'
  | 'caminadora'
  | 'eliptica'
  | 'remo_ergometro'
  | 'peso_corporal';

export interface Exercise {
  id: string;
  nombre: string;
  grupoPrimario: GrupoMuscular;
  gruposSecundarios: GrupoMuscular[];
  equipamientoRequerido: Equipamiento[];
  // Nivel mínimo de programa en el que puede aparecer este ejercicio.
  nivelMinimo: NivelPrograma;
  patron: PatronMovimiento;
  instrucciones: string;
  erroresComunes: string[];
  etiquetas: string[];
  // IDs de ejercicios candidatos a sustitución, en orden de preferencia.
  alternativas: string[];
}

export interface Limitaciones {
  lesiones: string[]; // etiquetas libres, ej. "hombro", "rodilla", "lumbar"
  dolorActual: string[];
  patronesExcluidos: PatronMovimiento[]; // derivado de lesiones reportadas
  ejerciciosExcluidosIds: string[];
  requiereConsultaProfesional: boolean;
}

export interface PerfilUsuario {
  edad: number;
  sexo: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  pesoKg: number;
  alturaCm: number;
  nivelExperiencia: NivelExperiencia;
}

export interface Disponibilidad {
  diasPorSemana: number; // v1: recomendado mínimo 5, pero el motor soporta 2-7
  minutosPorSesion: number;
}

export interface PreferenciasUsuario {
  musculosPrioritarios: GrupoMuscular[]; // máx. 2 recomendado
  modalidadCardioPreferida: string[]; // "caminata", "bicicleta", etc.
  ejerciciosExcluidosIds: string[]; // por preferencia, no por lesión
  ejerciciosFavoritosIds: string[];
  solicitaOlympia: boolean; // el usuario pidió explícitamente el nivel élite
}

export interface HistorialRendimiento {
  // Resumen agregado de las últimas N sesiones por ejercicio, calculado
  // fuera del motor (en el Adaptation Engine / capa de datos) y pasado
  // como input de solo lectura.
  semanasEntrenando: number;
  adherenciaUltimasSemanas: number; // 0..1 (sesiones completadas / planificadas)
  recoveryScorePromedio: number; // 0..100
  rirPromedioReciente: number | null; // null si no hay datos suficientes
  tendenciaRendimiento: 'subiendo' | 'estable' | 'bajando' | 'sin_datos';
}

export interface EngineInput {
  perfil: PerfilUsuario;
  objetivo: ObjetivoTipo;
  disponibilidad: Disponibilidad;
  equipamientoDisponible: Equipamiento[];
  preferencias: PreferenciasUsuario;
  limitaciones: Limitaciones;
  historial: HistorialRendimiento | null; // null = usuario nuevo, sin historial
}

// ----------------------- Salida del motor -----------------------

export interface WorkoutExercisePlan {
  exerciseId: string;
  nombre: string;
  grupoPrimario: GrupoMuscular;
  series: number;
  repsMin: number;
  repsMax: number;
  descansoSeg: number;
  rirObjetivo: number; // 0-3
  esSuperset: boolean;
  grupoSupersetId: string | null;
  sustituidoDesde: string | null; // id del ejercicio "ideal" original, si aplica
  motivoSustitucion: string | null;
}

export interface CardioBlockPlan {
  modalidad: string;
  duracionMin: number;
  intensidad: 'baja' | 'moderada' | 'alta' | 'intervalos';
  motivo: string;
}

export interface WorkoutDayPlan {
  // Presente solo cuando el día viene de un plan ya persistido (permite
  // referenciarlo al iniciar una sesión de entrenamiento). Al generar un
  // plan nuevo (aún no guardado), el motor no conoce este id: queda null.
  id: string | null;
  orden: number;
  nombre: string;
  gruposMusculares: GrupoMuscular[];
  ejercicios: WorkoutExercisePlan[];
  cardio: CardioBlockPlan | null;
}

export interface EngineWarning {
  codigo: string;
  mensaje: string;
}

export interface WorkoutPlanResult {
  nivelPrograma: NivelPrograma;
  nivelSolicitado: NivelPrograma | null; // si hubo degradación, aquí queda el original
  dias: WorkoutDayPlan[];
  warnings: EngineWarning[];
  // Trazabilidad: por qué se tomó cada decisión importante. Consumido por la
  // capa de explicación (IA) para responder "por qué me diste esta rutina".
  trace: string[];
}
