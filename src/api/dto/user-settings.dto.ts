/**
 * DTO de entrada del endpoint PUT /users/:userId/profile.
 * Coincide con la forma de UserSettings (dominio). El servicio de aplicación
 * valida los campos vía validateUserSettings(); el DTO tipa el límite del
 * controlador para que no acepte `unknown`.
 */
export class UserSettingsDto {
  edad!: number;
  sexo!: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  pesoKg!: number;
  alturaCm!: number;
  nivelExperiencia!: 'principiante' | 'intermedio' | 'avanzado';
  objetivo!: 'perdida_grasa' | 'hipertrofia';
  diasPorSemana!: number;
  minutosPorSesion!: number;
  equipamiento!: string[];
  pesoObjetivoKg!: number | null;
  lesiones!: string[];
  dolorActual!: string[];
  condicionMedica!: boolean;
  musculosPrioritarios!: string[];
}
