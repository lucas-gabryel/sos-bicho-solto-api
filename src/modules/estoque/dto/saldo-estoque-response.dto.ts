import { ApiProperty } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';

export class ItemSaldoEstoqueDto {
  @ApiProperty({
    description: 'Chave única de agrupamento do item (tipoItem + unidade + descricao)',
  })
  chave!: string;

  @ApiProperty({ enum: TipoDoacao })
  tipoItem!: TipoDoacao;

  @ApiProperty()
  descricaoItem!: string;

  @ApiProperty()
  unidadeMedida!: string;

  @ApiProperty({ description: 'Total acumulado de entradas' })
  totalEntradas!: number;

  @ApiProperty({ description: 'Total acumulado de saídas e consumos' })
  totalSaidas!: number;

  @ApiProperty({ description: 'Saldo disponível no momento' })
  saldoAtual!: number;

  @ApiProperty({
    description: 'Indicador se o item está em nível crítico ou zerado',
  })
  status!: 'ADEQUADO' | 'BAIXO' | 'ZERADO';

  @ApiProperty({ description: 'Data da última movimentação registrada' })
  ultimaMovimentacaoEm!: Date;
}

export class ResumoEstoqueResponseDto {
  @ApiProperty({ type: [ItemSaldoEstoqueDto] })
  itens!: ItemSaldoEstoqueDto[];

  @ApiProperty()
  totalItensDiferentes!: number;

  @ApiProperty()
  totalItensZerados!: number;

  @ApiProperty()
  totalItensBaixos!: number;
}
