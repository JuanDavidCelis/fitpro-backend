export type NivelExperiencia = 'principiante' | 'intermedio' | 'avanzado';
export type NivelPrograma = 'foundation' | 'growth' | 'advanced' | 'olympia';
export type ObjetivoTipo = 'perdida_grasa' | 'hipertrofia';
export type PatronMovimiento = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'core' | 'cardio';
export type AreaCorporal = 'hombro' | 'codo' | 'muneca' | 'espalda_baja' | 'cadera' | 'rodilla' | 'tobillo';
export type GrupoMuscular = 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps' | 'antebrazo' | 'abdomen' | 'oblicuos' | 'gluteos' | 'cuadriceps' | 'femoral' | 'pantorrilla' | 'trapecio' | 'aductores' | 'cardio';
export type Equipamiento = 'mancuernas' | 'barra' | 'discos' | 'rack' | 'poleas' | 'banco' | 'maquinas' | 'smith' | 'prensa' | 'bicicleta' | 'caminadora' | 'eliptica' | 'remo_ergometro' | 'peso_corporal' | 'maquina_hack' | 'maquina_extension_cuadriceps' | 'cajon' | 'agarre_neutro' | 'maquina_pec_deck' | 'maquina' | 'banco_inclinado' | 'barra_recta' | 'soporte_t' | 'maquina_dominadas_asistidas' | 'cuerda' | 'agarre_individual' | 'barra_v' | 'mancuerna' | 'maquina_curl_femoral_sentado' | 'maquina_curl_femoral_acostado' | 'maquina_extension_cadera' | 'maquina_abduccion_cadera' | 'tobillera' | 'maquina_adductores' | 'maquina_aductores' | 'rueda_abdominal' | 'barra_dominadas' | 'maquina_pantorrilla_sentado' | 'escalon' | 'banco_declinado' | 'maquina_press_convergente' | 'barra_ez' | 'banco_predicador' | 'kettlebell' | 'trap_bar' | 'trineo' | 'cuerda_saltar' | 'maquina_escaladora' | 'piscina' | 'prensa_horizontal' | 'banco_extension_lumbar' | 'maquina_pendulo' | 'agarre';
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
    alternativas: string[];
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
