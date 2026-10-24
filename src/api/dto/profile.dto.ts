import { IsInt, IsOptional, IsString, IsBoolean, IsArray, IsNumber, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsInt()
  edad?: number;

  @IsOptional()
  @IsString()
  sexo?: string;

  @IsOptional()
  @IsNumber()
  pesoKg?: number;

  @IsOptional()
  @IsNumber()
  alturaCm?: number;

  @IsOptional()
  @IsIn(['principiante', 'intermedio', 'avanzado'])
  nivelExperiencia?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lesiones?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dolorActual?: string[];

  @IsOptional()
  @IsBoolean()
  requiereConsulta?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  musculosPrioritarios?: string[];

  @IsOptional()
  @IsNumber()
  pesoObjetivoKg?: number | null;
}

export class RegisterWeightDto {
  @IsNumber()
  pesoKg!: number;

  @IsOptional()
  @IsString()
  fuente?: string;
}