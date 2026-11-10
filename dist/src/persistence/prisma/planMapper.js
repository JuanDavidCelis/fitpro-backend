"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRowToResult = planRowToResult;
function planRowToResult(row) {
    const dias = row.dias
        .sort((a, b) => a.orden - b.orden)
        .map((dia) => ({
        id: dia.id,
        orden: dia.orden,
        nombre: dia.nombre,
        gruposMusculares: dia.gruposMusculares,
        ejercicios: dia.ejercicios
            .sort((a, b) => a.orden - b.orden)
            .map((ej) => ({
            exerciseId: ej.exerciseId,
            nombre: ej.exercise.nombre,
            grupoPrimario: ej.exercise.grupoPrimario,
            series: ej.series,
            repsMin: ej.repsMin,
            repsMax: ej.repsMax,
            descansoSeg: ej.descansoSeg,
            rirObjetivo: ej.rirObjetivo,
            esSuperset: ej.esSuperset,
            grupoSupersetId: ej.grupoSupersetId,
            sustituidoDesde: ej.sustituidoDesde,
            motivoSustitucion: ej.motivoSustitucion,
            instrucciones: ej.exercise.instrucciones ?? '',
            erroresComunes: Array.isArray(ej.exercise.erroresComunes) ? ej.exercise.erroresComunes : [],
            alternativas: Array.isArray(ej.exercise.alternativas) ? ej.exercise.alternativas : [],
        })),
        cardio: dia.cardioModalidad
            ? {
                modalidad: dia.cardioModalidad,
                duracionMin: dia.cardioDuracionMin ?? 0,
                intensidad: (dia.cardioIntensidad ?? 'moderada'),
                motivo: dia.cardioMotivo ?? '',
            }
            : null,
    }));
    return {
        nivelPrograma: row.nivelPrograma,
        nivelSolicitado: row.nivelSolicitado ?? null,
        dias,
        warnings: Array.isArray(row.warningsJson) ? row.warningsJson : [],
        trace: Array.isArray(row.traceJson) ? row.traceJson : [],
    };
}
