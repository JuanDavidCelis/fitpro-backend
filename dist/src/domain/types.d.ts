export type NivelExperiencia = 'principiante' | 'intermedio' | 'avanzado';
export type NivelPrograma = 'foundation' | 'growth' | 'advanced' | 'olympia';
export type ObjetivoTipo = 'perdida_grasa' | 'hipertrofia';
export type PatronMovimiento = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'core' | 'cardio';
export type AreaCorporal = 'hombro' | 'codo' | 'muneca' | 'espalda_baja' | 'cadera' | 'rodilla' | 'tobillo';
export type GrupoMuscular = 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'antebrazo' | 'abdomen' | 'gluteos' | 'cuadriceps' | 'femoral' | 'pantorrilla' | 'cardio';
export type Equipamiento = 'mancuernas' | 'barra' | 'discos' | 'rack' | 'poleas' | 'banco' | 'maquinas' | 'smith' | 'prensa' | 'bicicleta' | 'caminadora' | 'eliptica' | 'remo_ergometro' | 'peso_corporal';
export interface Exercise {
    id: string;
    nombre: string;
    grupoPrimario: GrupoMuscular;
    gruposSecundarios: GrupoMuscular[];
    equipamientoRequerido: Equipamiento[];
    nivelMinimo: NivelPrograma;
    patron: PatronMovimiento;
    instrucciones: string;
    erroresComunes: string[];
    etiquetas: string[];
    alternativas: string[];
}
export interface Limitaciones {
    lesiones: string[];
    dolorActual: string[];
    patronesExcluidos: PatronMovimiento[];
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
    diasPorSemana: number;
    minutosPorSesion: number;
}
export interface PreferenciasUsuario {
    musculosPrioritarios: GrupoMuscular[];
    modalidadCardioPreferida: string[];
    ejerciciosExcluidosIds: string[];
    ejerciciosFavoritosIds: string[];
    solicitaOlympia: boolean;
}
export interface HistorialRendimiento {
    semanasEntrenando: number;
    adherenciaUltimasSemanas: number;
    recoveryScorePromedio: number;
    rirPromedioReciente: number | null;
    tendenciaRendimiento: 'subiendo' | 'estable' | 'bajando' | 'sin_datos';
}
export interface EngineInput {
    perfil: PerfilUsuario;
    objetivo: ObjetivoTipo;
    disponibilidad: Disponibilidad;
    equipamientoDisponible: Equipamiento[];
    preferencias: PreferenciasUsuario;
    limitaciones: Limitaciones;
    historial: HistorialRendimiento | null;
}
export interface WorkoutExercisePlan {
    exerciseId: string;
    nombre: string;
    grupoPrimario: GrupoMuscular;
    series: number;
    repsMin: number;
    repsMax: number;
    descansoSeg: number;
    rirObjetivo: number;
    esSuperset: boolean;
    grupoSupersetId: string | null;
    sustituidoDesde: string | null;
    motivoSustitucion: string | null;
    instrucciones: string;
    erroresComunes: string[];
    imagenUrl?: string | null;
    gifUrl?: string | null;
}
export interface CardioBlockPlan {
    modalidad: string;
    duracionMin: number;
    intensidad: 'baja' | 'moderada' | 'alta' | 'intervalos';
    motivo: string;
}
export interface WorkoutDayPlan {
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
    nivelSolicitado: NivelPrograma | null;
    dias: WorkoutDayPlan[];
    warnings: EngineWarning[];
    trace: string[];
}
/**
 * Todo lo que el usuario puede cambiar después del registro. Es la fuente de
 * verdad para regenerar la rutina: nivel, objetivo, disponibilidad y equipo.
 */
export interface UserSettings {
    edad: number;
    sexo: PerfilUsuario['sexo'];
    pesoKg: number;
    alturaCm: number;
    nivelExperiencia: NivelExperiencia;
    objetivo: ObjetivoTipo;
    diasPorSemana: number;
    minutosPorSesion: number;
    equipamiento: Equipamiento[];
    pesoObjetivoKg: number | null;
    lesiones: AreaCorporal[];
    dolorActual: AreaCorporal[];
    condicionMedica: boolean;
    musculosPrioritarios: GrupoMuscular[];
}
