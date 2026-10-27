import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class RelatorioDoacoesFiltroDto {
  @ApiPropertyOptional({
    description: 'Data inicial no formato YYYY-MM-DD',
    example: '2026-10-01',
  })
  @IsOptional()
  @IsDateString()
  readonly dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final no formato YYYY-MM-DD',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString()
  readonly dataFim?: string;

  @ApiPropertyOptional({
    enum: TipoDoacao,
    description: 'Tipo de doação para filtragem',
  })
  @IsOptional()
  @IsEnum(TipoDoacao)
  readonly tipo?: TipoDoacao;
}
