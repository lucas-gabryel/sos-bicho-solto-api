import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { FiltrarMovimentacoesDto } from './dto/filtrar-movimentacoes.dto';
import { MovimentacaoResponseDto } from './dto/movimentacao-response.dto';
import { RegistrarMovimentacaoDto } from './dto/registrar-movimentacao.dto';
import {
  ItemSaldoEstoqueDto,
  ResumoEstoqueResponseDto,
} from './dto/saldo-estoque-response.dto';
import type { IEstoqueRepository } from './repositories/estoque.repository.interface';
import { ESTOQUE_REPOSITORY } from './repositories/estoque.repository.interface';

@Injectable()
export class EstoqueService {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async registrarMovimentacao(
    dto: RegistrarMovimentacaoDto,
    usuario?: JwtPayload,
  ): Promise<MovimentacaoResponseDto> {
    if (dto.tipoItem === TipoDoacao.DINHEIRO) {
      throw new BadRequestException(
        'Doações em dinheiro não movimentam estoque físico.',
      );
    }

    if (dto.quantidade <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    const descricaoItemFormatada = dto.descricaoItem.trim();
    const unidadeMedidaFormatada = dto.unidadeMedida.trim().toUpperCase();

    // Se for SAÍDA, valida se há saldo suficiente para evitar estoque negativo
    if (dto.tipo === TipoMovimentacaoEstoque.SAIDA) {
      const saldoAtual = await this.estoqueRepository.calcularSaldoItem(
        dto.tipoItem,
        descricaoItemFormatada,
        unidadeMedidaFormatada,
      );

      if (dto.quantidade > saldoAtual) {
        throw new BadRequestException(
          `Saldo insuficiente para baixa no estoque. Saldo disponível: ${saldoAtual} ${unidadeMedidaFormatada}. Quantidade solicitada: ${dto.quantidade}.`,
        );
      }
    }

    const movimentacao = await this.estoqueRepository.criar({
      tipo: dto.tipo,
      tipoItem: dto.tipoItem,
      descricaoItem: descricaoItemFormatada,
      quantidade: dto.quantidade,
      unidadeMedida: unidadeMedidaFormatada,
      motivo: dto.motivo.trim(),
      doacaoId: dto.doacaoId,
      registradoPorId: usuario?.sub,
    });

    return MovimentacaoResponseDto.fromEntity(movimentacao);
  }

  async listarMovimentacoes(
    query: FiltrarMovimentacoesDto,
  ): Promise<RespostaPaginada<MovimentacaoResponseDto>> {
    const { data, total } = await this.estoqueRepository.listar({
      skip: query.skip,
      take: query.take,
      tipo: query.tipo,
      tipoItem: query.tipoItem,
      busca: query.busca?.trim() || undefined,
    });

    return paginar(
      data.map((item) => MovimentacaoResponseDto.fromEntity(item)),
      total,
      query,
    );
  }

  async buscarPorId(id: string): Promise<MovimentacaoResponseDto> {
    const item = await this.estoqueRepository.buscarPorId(id);
    if (!item || !item.ativo) {
      throw new NotFoundException('Movimentação de estoque não encontrada.');
    }

    return MovimentacaoResponseDto.fromEntity(item);
  }

  async obterResumoSaldos(): Promise<ResumoEstoqueResponseDto> {
    const todasMovimentacoes = await this.estoqueRepository.obterTodasAtivas();

    // Agrupar por chave: tipoItem + "___" + descricaoItem (normalizada) + "___" + unidadeMedida (normalizada)
    const agrupamento = new Map<
      string,
      {
        tipoItem: TipoDoacao;
        descricaoItem: string;
        unidadeMedida: string;
        totalEntradas: number;
        totalSaidas: number;
        saldoAtual: number;
        ultimaMovimentacaoEm: Date;
      }
    >();

    for (const mov of todasMovimentacoes) {
      const descNorm = mov.descricaoItem.trim();
      const unitNorm = mov.unidadeMedida.trim().toUpperCase();
      const key = `${mov.tipoItem}:::${descNorm.toLowerCase()}:::${unitNorm.toLowerCase()}`;

      let registro = agrupamento.get(key);
      if (!registro) {
        registro = {
          tipoItem: mov.tipoItem,
          descricaoItem: descNorm,
          unidadeMedida: unitNorm,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoAtual: 0,
          ultimaMovimentacaoEm: mov.dataMovimento,
        };
        agrupamento.set(key, registro);
      }

      const qtd = Number(mov.quantidade);
      if (mov.tipo === TipoMovimentacaoEstoque.ENTRADA) {
        registro.totalEntradas += qtd;
        registro.saldoAtual += qtd;
      } else if (mov.tipo === TipoMovimentacaoEstoque.SAIDA) {
        registro.totalSaidas += qtd;
        registro.saldoAtual -= qtd;
      } else if (mov.tipo === TipoMovimentacaoEstoque.AJUSTE) {
        registro.saldoAtual = qtd;
      }

      if (new Date(mov.dataMovimento) > new Date(registro.ultimaMovimentacaoEm)) {
        registro.ultimaMovimentacaoEm = mov.dataMovimento;
      }
    }

    const itens: ItemSaldoEstoqueDto[] = Array.from(agrupamento.entries()).map(
      ([key, data]) => {
        const saldoFinal = Math.max(0, data.saldoAtual);
        let status: 'ADEQUADO' | 'BAIXO' | 'ZERADO' = 'ADEQUADO';

        if (saldoFinal === 0) {
          status = 'ZERADO';
        } else if (
          // Regra de atenção: menos de 5 unidades ou kg
          saldoFinal <= 5 ||
          saldoFinal < data.totalEntradas * 0.15
        ) {
          status = 'BAIXO';
        }

        return {
          chave: key,
          tipoItem: data.tipoItem,
          descricaoItem: data.descricaoItem,
          unidadeMedida: data.unidadeMedida,
          totalEntradas: Number(data.totalEntradas.toFixed(2)),
          totalSaidas: Number(data.totalSaidas.toFixed(2)),
          saldoAtual: Number(saldoFinal.toFixed(2)),
          status,
          ultimaMovimentacaoEm: data.ultimaMovimentacaoEm,
        };
      },
    );

    // Ordena: primeiro zerados e baixos para alertar desabastecimento, depois alfabético
    itens.sort((a, b) => {
      const pesoStatus = { ZERADO: 0, BAIXO: 1, ADEQUADO: 2 };
      if (pesoStatus[a.status] !== pesoStatus[b.status]) {
        return pesoStatus[a.status] - pesoStatus[b.status];
      }
      return a.descricaoItem.localeCompare(b.descricaoItem);
    });

    return {
      itens,
      totalItensDiferentes: itens.length,
      totalItensZerados: itens.filter((i) => i.status === 'ZERADO').length,
      totalItensBaixos: itens.filter((i) => i.status === 'BAIXO').length,
    };
  }
}

