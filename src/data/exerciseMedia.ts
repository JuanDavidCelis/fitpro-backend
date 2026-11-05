// ============================================================================
// Imágenes de ejercicios: asociación entre NUESTROS ids de ejercicio y los del
// dataset https://github.com/Nielide/exercises-dataset (miniatura 180x180 + GIF).
//
// ⚠️ LICENCIA: el código y los textos del dataset son MIT, pero las IMÁGENES y
// GIFs pertenecen a Gym visual (https://gymvisual.com/). El autor del dataset
// los redistribuye con permiso y aclara que cualquier reutilización se rige por
// los términos de Gym visual: hay que obtener licencia propia antes de publicar
// la app. Por eso: (1) se conserva la atribución en pantalla y (2) hay un
// interruptor (EXERCISE_MEDIA_BASE_URL vacío = sin imágenes).
//
// Solo se mapean ejercicios con un equivalente real en el dataset. Los que no
// lo tienen (plancha, nordic curl, remo ergómetro, caminata simple, sentadilla
// sin peso, pike push-up...) quedan SIN imagen a propósito: es mejor no mostrar
// nada que mostrar un ejercicio equivocado.
// ============================================================================

export interface ExerciseMedia {
  datasetId: string;
  image: string; // ruta relativa a la raíz del repo del dataset
  gif: string;
}

export const MEDIA_ATTRIBUTION = '© Gym visual — https://gymvisual.com/';

export const EXERCISE_MEDIA: Record<string, ExerciseMedia> = {
  ex_press_banca_barra: { datasetId: '0025', image: 'images/0025-EIeI8Vf.jpg', gif: 'videos/0025-EIeI8Vf.gif' }, // barbell bench press
  ex_press_banca_mancuernas: { datasetId: '0289', image: 'images/0289-SpYC0Kp.jpg', gif: 'videos/0289-SpYC0Kp.gif' }, // dumbbell bench press
  ex_press_maquina_pecho: { datasetId: '0577', image: 'images/0577-T0yTjgW.jpg', gif: 'videos/0577-T0yTjgW.gif' }, // lever chest press
  ex_flexiones: { datasetId: '0662', image: 'images/0662-I4hDWkc.jpg', gif: 'videos/0662-I4hDWkc.gif' }, // push-up
  ex_press_inclinado_mancuernas: { datasetId: '0314', image: 'images/0314-ns0SIbU.jpg', gif: 'videos/0314-ns0SIbU.gif' }, // dumbbell incline bench press
  ex_aperturas_polea: { datasetId: '0188', image: 'images/0188-xLYSdtg.jpg', gif: 'videos/0188-xLYSdtg.gif' }, // cable middle fly
  ex_aperturas_mancuernas: { datasetId: '0308', image: 'images/0308-yz9nUhF.jpg', gif: 'videos/0308-yz9nUhF.gif' }, // dumbbell fly
  ex_dominadas: { datasetId: '0652', image: 'images/0652-lBDjFxJ.jpg', gif: 'videos/0652-lBDjFxJ.gif' }, // pull-up
  ex_jalon_pecho: { datasetId: '2330', image: 'images/2330-LEprlgG.jpg', gif: 'videos/2330-LEprlgG.gif' }, // cable lat pulldown full range of motion
  ex_remo_barra: { datasetId: '0027', image: 'images/0027-eZyBC3j.jpg', gif: 'videos/0027-eZyBC3j.gif' }, // barbell bent over row
  ex_remo_mancuerna: { datasetId: '0292', image: 'images/0292-C0MA9bC.jpg', gif: 'videos/0292-C0MA9bC.gif' }, // dumbbell one arm bent-over row
  ex_remo_maquina: { datasetId: '1350', image: 'images/1350-7I6LNUG.jpg', gif: 'videos/1350-7I6LNUG.gif' }, // lever seated row
  ex_remo_invertido: { datasetId: '0499', image: 'images/0499-bZGHsAZ.jpg', gif: 'videos/0499-bZGHsAZ.gif' }, // inverted row
  ex_press_militar_barra: { datasetId: '0091', image: 'images/0091-kTbSH9h.jpg', gif: 'videos/0091-kTbSH9h.gif' }, // barbell seated overhead press
  ex_press_hombro_mancuernas: { datasetId: '0405', image: 'images/0405-znQUdHY.jpg', gif: 'videos/0405-znQUdHY.gif' }, // dumbbell seated shoulder press
  ex_press_maquina_hombro: { datasetId: '0603', image: 'images/0603-67n3r98.jpg', gif: 'videos/0603-67n3r98.gif' }, // lever shoulder press
  ex_elevaciones_laterales: { datasetId: '0334', image: 'images/0334-DsgkuIt.jpg', gif: 'videos/0334-DsgkuIt.gif' }, // dumbbell lateral raise
  ex_elevaciones_laterales_polea: { datasetId: '0178', image: 'images/0178-goJ6ezq.jpg', gif: 'videos/0178-goJ6ezq.gif' }, // cable lateral raise
  ex_curl_barra: { datasetId: '0031', image: 'images/0031-25GPyDY.jpg', gif: 'videos/0031-25GPyDY.gif' }, // barbell curl
  ex_curl_mancuerna: { datasetId: '0294', image: 'images/0294-NbVPDMW.jpg', gif: 'videos/0294-NbVPDMW.gif' }, // dumbbell biceps curl
  ex_curl_polea: { datasetId: '0868', image: 'images/0868-G08RZcQ.jpg', gif: 'videos/0868-G08RZcQ.gif' }, // cable curl
  ex_curl_martillo: { datasetId: '0313', image: 'images/0313-slDvUAU.jpg', gif: 'videos/0313-slDvUAU.gif' }, // dumbbell hammer curl
  ex_press_frances: { datasetId: '0061', image: 'images/0061-iZop9xO.jpg', gif: 'videos/0061-iZop9xO.gif' }, // barbell lying triceps extension
  ex_extension_triceps_polea: { datasetId: '0201', image: 'images/0201-3ZflifB.jpg', gif: 'videos/0201-3ZflifB.gif' }, // cable pushdown
  ex_fondos_banco: { datasetId: '0129', image: 'images/0129-RrLske5.jpg', gif: 'videos/0129-RrLske5.gif' }, // bench dip (knees bent)
  ex_wrist_curl: { datasetId: '0401', image: 'images/0401-2dImyQ8.jpg', gif: 'videos/0401-2dImyQ8.gif' }, // dumbbell seated palms up wrist curl
  ex_reverse_wrist_curl: { datasetId: '0082', image: 'images/0082-LsZkfU6.jpg', gif: 'videos/0082-LsZkfU6.gif' }, // barbell reverse wrist curl
  ex_reverse_curl: { datasetId: '0080', image: 'images/0080-xNrS20v.jpg', gif: 'videos/0080-xNrS20v.gif' }, // barbell reverse curl
  ex_farmer_carry: { datasetId: '2133', image: 'images/2133-qPEzJjA.jpg', gif: 'videos/2133-qPEzJjA.gif' }, // farmers walk
  ex_wrist_roller: { datasetId: '0859', image: 'images/0859-bd5b860.jpg', gif: 'videos/0859-bd5b860.gif' }, // wrist rollerer
  ex_crunch_polea: { datasetId: '0175', image: 'images/0175-WW95auq.jpg', gif: 'videos/0175-WW95auq.gif' }, // cable kneeling crunch
  ex_elevacion_piernas: { datasetId: '0472', image: 'images/0472-I3tsCnC.jpg', gif: 'videos/0472-I3tsCnC.gif' }, // hanging leg raise
  ex_sentadilla_barra: { datasetId: '0043', image: 'images/0043-qXTaZnJ.jpg', gif: 'videos/0043-qXTaZnJ.gif' }, // barbell full squat
  ex_sentadilla_goblet: { datasetId: '1760', image: 'images/1760-yn8yg1r.jpg', gif: 'videos/1760-yn8yg1r.gif' }, // dumbbell goblet squat
  ex_prensa: { datasetId: '1463', image: 'images/1463-2Qh2J1e.jpg', gif: 'videos/1463-2Qh2J1e.gif' }, // sled 45° leg press (side pov)
  ex_zancadas: { datasetId: '0336', image: 'images/0336-RRWFUcw.jpg', gif: 'videos/0336-RRWFUcw.gif' }, // dumbbell lunge
  ex_peso_muerto_rumano: { datasetId: '0085', image: 'images/0085-wQ2c4XD.jpg', gif: 'videos/0085-wQ2c4XD.gif' }, // barbell romanian deadlift
  ex_peso_muerto_mancuernas: { datasetId: '1459', image: 'images/1459-rR0LJzx.jpg', gif: 'videos/1459-rR0LJzx.gif' }, // dumbbell romanian deadlift
  ex_curl_femoral_maquina: { datasetId: '0586', image: 'images/0586-17lJ1kr.jpg', gif: 'videos/0586-17lJ1kr.gif' }, // lever lying leg curl
  ex_peso_muerto_pierna_unica: { datasetId: '1757', image: 'images/1757-gKozT8X.jpg', gif: 'videos/1757-gKozT8X.gif' }, // dumbbell single leg deadlift
  ex_puente_gluteo_isquios: { datasetId: '3645', image: 'images/3645-rmEukuS.jpg', gif: 'videos/3645-rmEukuS.gif' }, // single leg bridge with outstretched leg
  ex_hip_thrust: { datasetId: '3562', image: 'images/3562-qg2PGl6.jpg', gif: 'videos/3562-qg2PGl6.gif' }, // barbell glute bridge two legs on bench (male)
  ex_puente_gluteo: { datasetId: '3013', image: 'images/3013-u0cNiij.jpg', gif: 'videos/3013-u0cNiij.gif' }, // low glute bridge on floor
  ex_elevacion_talones_pie: { datasetId: '0605', image: 'images/0605-ykUOVze.jpg', gif: 'videos/0605-ykUOVze.gif' }, // lever standing calf raise
  ex_elevacion_talones_peso_corporal: { datasetId: '1373', image: 'images/1373-bJYHBIN.jpg', gif: 'videos/1373-bJYHBIN.gif' }, // bodyweight standing calf raise
  ex_caminata_inclinada: { datasetId: '3666', image: 'images/3666-rjiM4L3.jpg', gif: 'videos/3666-rjiM4L3.gif' }, // walking on incline treadmill
  ex_bicicleta: { datasetId: '0798', image: 'images/0798-a8VDgLw.jpg', gif: 'videos/0798-a8VDgLw.gif' }, // stationary bike walk
  ex_eliptica: { datasetId: '2141', image: 'images/2141-rjtuP6X.jpg', gif: 'videos/2141-rjtuP6X.gif' }, // walk elliptical cross trainer
  ex_carrera: { datasetId: '0685', image: 'images/0685-oLrKqDH.jpg', gif: 'videos/0685-oLrKqDH.gif' }, // run
  ex_intervalos: { datasetId: '1160', image: 'images/1160-dK9394r.jpg', gif: 'videos/1160-dK9394r.gif' }, // burpee
};

const DEFAULT_BASE = 'https://cdn.jsdelivr.net/gh/Nielide/exercises-dataset@main/';

/**
 * Base de las URLs. EXERCISE_MEDIA_BASE_URL:
 *  - sin definir  -> CDN de jsDelivr sobre el repo público (por defecto)
 *  - ""  (vacío)  -> imágenes DESACTIVADAS (interruptor de emergencia/licencia)
 *  - otra URL     -> p. ej. tu propio bucket cuando tengas licencia
 */
export function mediaBaseUrl(): string | null {
  const raw = process.env.EXERCISE_MEDIA_BASE_URL;
  if (raw === undefined) return DEFAULT_BASE;
  const t = raw.trim();
  if (t === '') return null;
  return t.endsWith('/') ? t : `${t}/`;
}

export function mediaUrls(exerciseId: string, base: string | null = mediaBaseUrl()) {
  const m = base ? EXERCISE_MEDIA[exerciseId] : undefined;
  return { imagenUrl: m ? base + m.image : null, gifUrl: m ? base + m.gif : null };
}
