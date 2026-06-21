import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginacaoDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Página atual (começa em 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    description: 'Itens por página',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}

export interface MetaPaginacao {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RespostaPaginada<T> {
  data: T[];
  meta: MetaPaginacao;
}

export function paginar<T>(
  data: T[],
  total: number,
  paginacao: PaginacaoDto,
): RespostaPaginada<T> {
  return {
    data,
    meta: {
      page: paginacao.page,
      limit: paginacao.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / paginacao.limit),
    },
  };
}
