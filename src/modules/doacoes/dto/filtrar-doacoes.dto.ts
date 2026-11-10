import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarDoacoesDto extends PaginacaoDto {
  @ApiPropertyOptional({
    enum: TipoDoacao,
    description: 'Filtrar por tipo de doação',
  })
  @IsOptional()
  @IsEnum(TipoDoacao)
  readonly tipo?: TipoDoacao;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do doador vinculado',
  })
  @IsOptional()
  @IsUUID('4')
  readonly doadorId?: string;

  @ApiPropertyOptional({
    description: 'Busca textual por descrição, unidade ou nome/documento do doador',
  })
  @IsOptional()
  @IsString()
  readonly busca?: string;
}
