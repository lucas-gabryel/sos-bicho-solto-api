import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  EspecieAnimal,
  SexoAnimal,
  PorteAnimal,
  StatusAnimal,
} from '@prisma/client';
import { CriarEventoAnimalDto } from './criar-evento-animal.dto';

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

  @ApiPropertyOptional({ example: 11.2, type: 'number' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  readonly pesoAtual?: number;

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
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  readonly dataNascimento?: Date;

  @ApiPropertyOptional({
    enum: StatusAnimal,
    example: StatusAnimal.TRANSFERIDO,
    description:
      'Status atual do animal (ex.: ACOLHIMENTO, TRANSFERIDO ou OBITO; adoção deve ser registrada em /adocoes)',
  })
  @IsEnum(StatusAnimal)
  @IsOptional()
  readonly status?: StatusAnimal;

  @ApiPropertyOptional({
    example: 'Transferido para clínica parceira em Maceió/AL',
    description:
      'Descrição complementar opcional para o evento automático de saída ao alterar o status',
  })
  @IsString()
  @IsOptional()
  readonly motivoSaidaDescricao?: string;

  @ApiPropertyOptional({
    type: CriarEventoAnimalDto,
    description:
      'Novo evento incremental opcional para adicionar à linha do tempo durante a edição',
  })
  @ValidateNested()
  @Type(() => CriarEventoAnimalDto)
  @IsOptional()
  readonly novoEvento?: CriarEventoAnimalDto;

  @ApiPropertyOptional({
    type: [CriarEventoAnimalDto],
    description:
      'Lista opcional de novos eventos incrementais para adicionar à linha do tempo durante a edição',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriarEventoAnimalDto)
  @IsOptional()
  readonly eventos?: CriarEventoAnimalDto[];
}
