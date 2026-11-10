import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { MovimentacaoEstoque } from './entities/movimentacao-estoque.entity';
import { FiltrarMovimentacoesDto } from './dto/filtrar-movimentacoes.dto';
import { MovimentacaoResponseDto } from './dto/movimentacao-response.dto';
import { RegistrarMovimentacaoDto } from './dto/registrar-movimentacao.dto';
import {
  ItemSaldoEstoqueDto,
  ResumoEstoqueResponseDto,
} from './dto/saldo-estoque-response.dto';
import type { IEstoqueRepository } from './repositories/estoque.repository.interface';
import { ESTOQUE_REPOSITORY } from './repositories/estoque.repository.interface';
import {
  calcularSaldoDeMovimentacoes,
  gerarChaveItemEstoque,
  normalizarItemEstoque,
} from './utils/estoque.utils';

@Injectable()
export class EstoqueService {
  constructor(
    @Inject(ESTOQUE_REPOSITORY)
    private readonly estoqueRepository: IEstoqueRepository,
  ) {}

  async registrarMovimentacao(
    dto: RegistrarMovimentacaoDto,
    usuario?: JwtPayload,
    txContext?: Prisma.TransactionClient,
  ): Promise<MovimentacaoResponseDto> {
    if (dto.tipoItem === TipoDoacao.DINHEIRO) {
      throw new BadRequestException(
        'Doações em dinheiro não movimentam estoque físico.',
      );
    }

    if (dto.tipo === TipoMovimentacaoEstoque.AJUSTE) {
      if (dto.quantidade < 0) {
        throw new BadRequestException(
          'A quantidade para ajuste deve ser maior ou igual a zero.',
        );
      }
    } else if (dto.quantidade <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    const {
      descricaoItem: descricaoItemFormatada,
      unidadeMedida: unidadeMedidaFormatada,
    } = normalizarItemEstoque(dto.descricaoItem, dto.unidadeMedida);

    const executarOperacao = async (tx: Prisma.TransactionClient) => {
      // Para operações de SAIDA ou AJUSTE, adquire lock exclusivo do item
      if (
        dto.tipo === TipoMovimentacaoEstoque.SAIDA ||
        dto.tipo === TipoMovimentacaoEstoque.AJUSTE
      ) {
        const chave = gerarChaveItemEstoque(
          dto.tipoItem,
          descricaoItemFormatada,
          unidadeMedidaFormatada,
        );
        await this.estoqueRepository.bloquearItemParaMovimentacao(chave, tx);
      }

      // Se for SAÍDA, valida se há saldo suficiente para evitar estoque negativo
      if (dto.tipo === TipoMovimentacaoEstoque.SAIDA) {
        const saldoRetornado = await this.estoqueRepository.calcularSaldoItem(
          dto.tipoItem,
          descricaoItemFormatada,
          unidadeMedidaFormatada,
          tx,
        );

        const saldoAtual =
          saldoRetornado instanceof Prisma.Decimal
            ? saldoRetornado
            : new Prisma.Decimal(String(saldoRetornado));

        const quantidadeSolicitada = new Prisma.Decimal(dto.quantidade.toString());

        if (quantidadeSolicitada.greaterThan(saldoAtual)) {
          throw new BadRequestException(
            `Saldo insuficiente para baixa no estoque. Saldo disponível: ${saldoAtual.toNumber()} ${unidadeMedidaFormatada}. Quantidade solicitada: ${dto.quantidade}.`,
          );
        }
      }

      const movimentacao = await this.estoqueRepository.criar(
        {
          tipo: dto.tipo,
          tipoItem: dto.tipoItem,
          descricaoItem: descricaoItemFormatada,
          quantidade: dto.quantidade,
          unidadeMedida: unidadeMedidaFormatada,
          motivo: dto.motivo.trim(),
          doacaoId: dto.doacaoId,
          registradoPorId: usuario?.sub,
        },
        tx,
      );

      return MovimentacaoResponseDto.fromEntity(movimentacao);
    };

    if (txContext) {
      return executarOperacao(txContext);
    }

    return this.estoqueRepository.executarTransacao(executarOperacao);
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

    // Agrupar por chave única normalizada
    const agrupamento = new Map<
      string,
      {
        tipoItem: TipoDoacao;
        descricaoItem: string;
        unidadeMedida: string;
        movimentacoes: MovimentacaoEstoque[];
        totalEntradas: Prisma.Decimal;
        totalSaidas: Prisma.Decimal;
        saldoAtual: Prisma.Decimal;
        ultimaMovimentacaoEm: Date;
      }
    >();

    for (const mov of todasMovimentacoes) {
      const {
        descricaoItem: descNorm,
        unidadeMedida: unitNorm,
      } = normalizarItemEstoque(mov.descricaoItem, mov.unidadeMedida);
      const key = gerarChaveItemEstoque(mov.tipoItem, descNorm, unitNorm);

      let registro = agrupamento.get(key);
      if (!registro) {
        registro = {
          tipoItem: mov.tipoItem,
          descricaoItem: descNorm,
          unidadeMedida: unitNorm,
          movimentacoes: [],
          totalEntradas: new Prisma.Decimal(0),
          totalSaidas: new Prisma.Decimal(0),
          saldoAtual: new Prisma.Decimal(0),
          ultimaMovimentacaoEm: mov.dataMovimento,
        };
        agrupamento.set(key, registro);
      }

      registro.movimentacoes.push(mov);

      const qtd = new Prisma.Decimal(mov.quantidade.toString());
      if (mov.tipo === TipoMovimentacaoEstoque.ENTRADA) {
        registro.totalEntradas = registro.totalEntradas.plus(qtd);
      } else if (mov.tipo === TipoMovimentacaoEstoque.SAIDA) {
        registro.totalSaidas = registro.totalSaidas.plus(qtd);
      }

      if (new Date(mov.dataMovimento) > new Date(registro.ultimaMovimentacaoEm)) {
        registro.ultimaMovimentacaoEm = mov.dataMovimento;
      }
    }

    const itens: ItemSaldoEstoqueDto[] = Array.from(agrupamento.entries()).map(
      ([key, data]) => {
        // Usa a mesma função centralizada de cálculo de saldo
        const saldoCalculado = calcularSaldoDeMovimentacoes(data.movimentacoes);
        const saldoFinal = saldoCalculado.isNegative()
          ? new Prisma.Decimal(0)
          : saldoCalculado;

        let status: 'ADEQUADO' | 'BAIXO' | 'ZERADO' = 'ADEQUADO';

        if (saldoFinal.isZero()) {
          status = 'ZERADO';
        } else if (
          saldoFinal.lessThanOrEqualTo(5) ||
          saldoFinal.lessThan(data.totalEntradas.mul(0.15))
        ) {
          status = 'BAIXO';
        }

        return {
          chave: key,
          tipoItem: data.tipoItem,
          descricaoItem: data.descricaoItem,
          unidadeMedida: data.unidadeMedida,
          totalEntradas: data.totalEntradas.toNumber(),
          totalSaidas: data.totalSaidas.toNumber(),
          saldoAtual: saldoFinal.toNumber(),
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

