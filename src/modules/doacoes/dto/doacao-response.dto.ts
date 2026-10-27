import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao } from '@prisma/client';
import { DoacaoComRelacoes } from '../repositories/doacoes.repository.interface';

export class DoadorResumoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: 'Pet Shop Amigo Fiel LTDA' })
  readonly nome!: string;

  @ApiProperty({ example: '11222333000181' })
  readonly cpfCnpj!: string;
}

export class RegistradorResumoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  readonly id!: string;

  @ApiProperty({ example: 'Maria Santos' })
  readonly nome!: string;
}

export class DoacaoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ enum: TipoDoacao, example: TipoDoacao.DINHEIRO })
  readonly tipo!: TipoDoacao;

  @ApiPropertyOptional({ example: 150.0 })
  readonly valor?: number | null;

  @ApiPropertyOptional({ example: 15.0 })
  readonly quantidade?: number | null;

  @ApiPropertyOptional({ example: 'kg' })
  readonly unidadeMedida?: string | null;

  @ApiPropertyOptional({ example: 'Ração especial cães' })
  readonly descricao?: string | null;

  @ApiProperty({ example: '2026-10-26' })
  readonly dataRecebimento!: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly doadorId?: string | null;

  @ApiProperty({ example: false, description: 'Indica se a doação é anônima' })
  readonly anonima!: boolean;

  @ApiPropertyOptional({ type: DoadorResumoDto })
  readonly doador?: DoadorResumoDto | null;

  @ApiPropertyOptional({ type: RegistradorResumoDto })
  readonly registradoPor?: RegistradorResumoDto | null;

  @ApiProperty({ example: '2026-10-26T12:00:00.000Z' })
  readonly criadoEm!: Date;

  @ApiProperty({ example: '2026-10-26T12:00:00.000Z' })
  readonly modificadoEm!: Date;

  static fromEntity(doacao: DoacaoComRelacoes): DoacaoResponseDto {
    const dto = new DoacaoResponseDto();
    const dataRecebimentoStr =
      doacao.dataRecebimento instanceof Date
        ? doacao.dataRecebimento.toISOString().slice(0, 10)
        : String(doacao.dataRecebimento).slice(0, 10);

    Object.assign(dto, {
      id: doacao.id,
      tipo: doacao.tipo,
      valor: doacao.valor !== null && doacao.valor !== undefined ? Number(doacao.valor) : null,
      quantidade: doacao.quantidade !== null && doacao.quantidade !== undefined ? Number(doacao.quantidade) : null,
      unidadeMedida: doacao.unidadeMedida ?? null,
      descricao: doacao.descricao ?? null,
      dataRecebimento: dataRecebimentoStr,
      doadorId: doacao.doadorId ?? null,
      anonima: !doacao.doadorId,
      doador: doacao.doador
        ? {
            id: doacao.doador.id,
            nome: doacao.doador.nomeRazaoSocial,
            cpfCnpj: doacao.doador.cpfCnpj,
          }
        : null,
      registradoPor: doacao.registradoPor
        ? {
            id: doacao.registradoPor.id,
            nome: doacao.registradoPor.nome,
          }
        : null,
      criadoEm: doacao.criadoEm,
      modificadoEm: doacao.modificadoEm,
    });

    return dto;
  }
}
