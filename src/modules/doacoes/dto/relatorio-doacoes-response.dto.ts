import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';
import { DoacaoResponseDto } from './doacao-response.dto';

export const LABELS_TIPO_DOACAO: Record<TipoDoacao, string> = {
  [TipoDoacao.DINHEIRO]: 'Dinheiro',
  [TipoDoacao.RACAO]: 'Ração',
  [TipoDoacao.MEDICAMENTO]: 'Medicamento',
  [TipoDoacao.PRODUTO_LIMPEZA]: 'Produto de Limpeza',
  [TipoDoacao.OUTRO]: 'Outro',
};

export class ItemAgrupadoDto {
  @ApiProperty({ enum: TipoDoacao, example: TipoDoacao.RACAO })
  readonly tipo!: TipoDoacao;

  @ApiProperty({ example: 'Ração' })
  readonly tipoLabel!: string;

  @ApiProperty({ example: 150 })
  readonly quantidadeTotal!: number;

  @ApiPropertyOptional({ example: 'kg' })
  readonly unidadeMedida?: string | null;
}

export class ResumoRelatorioDto {
  @ApiProperty({ example: 2500.5 })
  readonly totalDinheiro!: number;

  @ApiProperty({ example: 'R$ 2.500,50' })
  readonly totalDinheiroFormatado!: string;

  @ApiProperty({ example: 500.0 })
  readonly totalDinheiroRealizado!: number;

  @ApiProperty({ example: 'R$ 500,00' })
  readonly totalDinheiroRealizadoFormatado!: string;

  @ApiProperty({ type: [ItemAgrupadoDto] })
  readonly itensAgrupados!: ItemAgrupadoDto[];

  @ApiProperty({ type: [ItemAgrupadoDto] })
  readonly itensRealizadosAgrupados!: ItemAgrupadoDto[];

  @ApiProperty({ example: 42 })
  readonly totalRegistros!: number;

  @ApiProperty({ example: 35 })
  readonly totalRecebidas!: number;

  @ApiProperty({ example: 7 })
  readonly totalRealizadas!: number;
}

export class FiltrosAplicadosDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  readonly dataInicio?: string | null;

  @ApiPropertyOptional({ example: '2026-10-31' })
  readonly dataFim?: string | null;

  @ApiPropertyOptional({ enum: TipoDoacao })
  readonly tipo?: TipoDoacao | null;
}

export class RelatorioDoacoesResponseDto {
  @ApiProperty({ type: ResumoRelatorioDto })
  readonly resumo!: ResumoRelatorioDto;

  @ApiProperty({ type: FiltrosAplicadosDto })
  readonly filtros!: FiltrosAplicadosDto;

  @ApiProperty({ type: [DoacaoResponseDto] })
  readonly doacoes!: DoacaoResponseDto[];

  @ApiProperty({ example: '2026-10-27T17:00:00.000Z' })
  readonly geradoEm!: string;
}
