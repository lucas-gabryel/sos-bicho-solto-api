import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class CriarDoacaoDto {
  @ApiProperty({
    enum: TipoDoacao,
    example: TipoDoacao.DINHEIRO,
    description: 'Tipo de doação recebida',
  })
  @IsEnum(TipoDoacao)
  readonly tipo!: TipoDoacao;

  @ApiPropertyOptional({
    example: 150.0,
    description: 'Valor monetário da doação (obrigatório se tipo for DINHEIRO)',
  })
  @ValidateIf((o: CriarDoacaoDto) => o.tipo === TipoDoacao.DINHEIRO)
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor deve ser um número válido' })
  @Min(0.01, { message: 'O valor deve ser maior que zero' })
  readonly valor?: number;

  @ApiPropertyOptional({
    example: 15,
    description:
      'Quantidade de itens recebidos (obrigatório se tipo NÃO for DINHEIRO)',
  })
  @ValidateIf((o: CriarDoacaoDto) => o.tipo !== TipoDoacao.DINHEIRO)
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido' })
  @Min(0.01, { message: 'A quantidade deve ser maior que zero' })
  readonly quantidade?: number;

  @ApiPropertyOptional({
    example: 'kg',
    description:
      'Unidade de medida da quantidade (ex: kg, unidades, caixas, pacotes)',
  })
  @IsOptional()
  @IsString()
  readonly unidadeMedida?: string;

  @ApiPropertyOptional({
    example: 'Ração Golden Especial para cães adultos',
    description: 'Descrição adicional ou detalhamento da doação',
  })
  @IsOptional()
  @IsString()
  readonly descricao?: string;

  @ApiProperty({
    example: '2026-10-26',
    description: 'Data em que a doação foi recebida (YYYY-MM-DD)',
  })
  @IsDateString(
    {},
    { message: 'A data de recebimento deve ser válida no formato YYYY-MM-DD' },
  )
  readonly dataRecebimento!: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'ID do doador cadastrado (obrigatório se a doação não for anônima)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'O ID do doador deve ser um UUID válido' })
  readonly doadorId?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Indica se a doação é anônima (sem doador vinculado)',
  })
  @IsOptional()
  @IsBoolean()
  readonly anonima?: boolean;
}
