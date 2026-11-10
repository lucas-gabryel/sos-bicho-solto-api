import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { MovimentacaoEstoque } from '../entities/movimentacao-estoque.entity';

export class MovimentacaoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TipoMovimentacaoEstoque })
  tipo!: TipoMovimentacaoEstoque;

  @ApiProperty({ enum: TipoDoacao })
  tipoItem!: TipoDoacao;

  @ApiProperty()
  descricaoItem!: string;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  unidadeMedida!: string;

  @ApiProperty()
  motivo!: string;

  @ApiProperty()
  dataMovimento!: Date;

  @ApiPropertyOptional()
  doacaoId?: string | null;

  @ApiPropertyOptional()
  registradoPorId?: string | null;

  @ApiPropertyOptional()
  registradoPorNome?: string | null;

  @ApiProperty()
  criadoEm!: Date;

  static fromEntity(
    entity: MovimentacaoEstoque & {
      registradoPor?: { id: string; nome: string } | null;
    },
  ): MovimentacaoResponseDto {
    const dto = new MovimentacaoResponseDto();
    dto.id = entity.id;
    dto.tipo = entity.tipo;
    dto.tipoItem = entity.tipoItem;
    dto.descricaoItem = entity.descricaoItem;
    dto.quantidade = Number(entity.quantidade);
    dto.unidadeMedida = entity.unidadeMedida;
    dto.motivo = entity.motivo;
    dto.dataMovimento = entity.dataMovimento;
    dto.doacaoId = entity.doacaoId ?? null;
    dto.registradoPorId = entity.registradoPorId ?? null;
    dto.registradoPorNome =
      entity.registradoPor?.nome ?? entity.registradoPorNome ?? null;
    dto.criadoEm = entity.criadoEm;
    return dto;
  }
}
