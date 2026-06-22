import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsISO8601,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EspecieAnimal, SexoAnimal, PorteAnimal } from '@prisma/client';

export class AtualizarAnimalDto {
  @ApiPropertyOptional({ example: 'Rex' })
  @IsString()
  @IsOptional()
  readonly nome?: string;

  @ApiPropertyOptional({ enum: EspecieAnimal, example: 'CAO' })
  @IsEnum(EspecieAnimal)
  @IsOptional()
  readonly especie?: EspecieAnimal;

  @ApiPropertyOptional({ example: 'SRD' })
  @IsString()
  @IsOptional()
  readonly raca?: string;

  @ApiPropertyOptional({ enum: SexoAnimal, example: 'MACHO' })
  @IsEnum(SexoAnimal)
  @IsOptional()
  readonly sexo?: SexoAnimal;

  @ApiPropertyOptional({ enum: PorteAnimal, example: 'MEDIO' })
  @IsEnum(PorteAnimal)
  @IsOptional()
  readonly porte?: PorteAnimal;

  @ApiPropertyOptional({ example: 'Caramelo' })
  @IsString()
  @IsOptional()
  readonly cor?: string;

  @ApiPropertyOptional({ example: 10.5, type: 'number' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  readonly pesoInicial?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  readonly castrado?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  readonly vacinado?: boolean;

  @ApiPropertyOptional({ example: 'Centro, Arapiraca/AL' })
  @IsString()
  @IsOptional()
  readonly localResgate?: string;

  @ApiPropertyOptional({ example: 'Animal dócil e vacinado' })
  @IsString()
  @IsOptional()
  readonly observacoes?: string;

  @ApiPropertyOptional({
    example: '2023-06-21T10:00:00Z',
    type: 'string',
    format: 'date-time',
  })
  @IsISO8601()
  @IsOptional()
  @Type(() => Date)
  readonly dataNascimento?: Date;
}
