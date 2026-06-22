import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsISO8601,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EspecieAnimal, SexoAnimal, PorteAnimal } from '@prisma/client';

export class CriarAnimalDto {
  @ApiProperty({ example: 'Rex' })
  @IsString()
  @IsNotEmpty()
  readonly nome!: string;

  @ApiProperty({ enum: EspecieAnimal, example: 'CAO' })
  @IsEnum(EspecieAnimal)
  @IsNotEmpty()
  readonly especie!: EspecieAnimal;

  @ApiProperty({ example: 'SRD' })
  @IsString()
  @IsNotEmpty()
  readonly raca!: string;

  @ApiProperty({ enum: SexoAnimal, example: 'MACHO' })
  @IsEnum(SexoAnimal)
  @IsNotEmpty()
  readonly sexo!: SexoAnimal;

  @ApiProperty({ enum: PorteAnimal, example: 'MEDIO', required: false })
  @IsEnum(PorteAnimal)
  @IsOptional()
  readonly porte?: PorteAnimal;

  @ApiProperty({ example: 'Caramelo' })
  @IsString()
  @IsNotEmpty()
  readonly cor!: string;

  @ApiProperty({ example: 10.5, type: 'number' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  readonly pesoInicial!: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  readonly castrado?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  readonly vacinado?: boolean;

  @ApiProperty({ example: 'Centro, Arapiraca/AL' })
  @IsString()
  @IsNotEmpty()
  readonly localResgate!: string;

  @ApiProperty({ example: 'Animal dócil e vacinado', required: false })
  @IsString()
  @IsOptional()
  readonly observacoes?: string;

  @ApiProperty({
    example: '2023-06-21T10:00:00Z',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @IsISO8601()
  @IsOptional()
  @Type(() => Date)
  readonly dataNascimento?: Date;
}
