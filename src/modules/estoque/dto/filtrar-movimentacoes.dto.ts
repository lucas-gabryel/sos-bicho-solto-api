import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarMovimentacoesDto extends PaginacaoDto {
  @ApiPropertyOptional({
    enum: TipoMovimentacaoEstoque,
    description: 'Filtrar por tipo de movimentação',
  })
  @IsEnum(TipoMovimentacaoEstoque)
  @IsOptional()
  tipo?: TipoMovimentacaoEstoque;

  @ApiPropertyOptional({
    enum: TipoDoacao,
    description: 'Filtrar por tipo/categoria do item',
  })
  @IsEnum(TipoDoacao)
  @IsOptional()
  tipoItem?: TipoDoacao;

  @ApiPropertyOptional({
    description: 'Busca por texto na descrição ou motivo',
  })
  @IsString()
  @IsOptional()
  busca?: string;
}

