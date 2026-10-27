import { Injectable } from '@nestjs/common';
import { Prisma, TipoDoacao } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  AgrupamentoItemDoacao,
  CriarDoacaoData,
  DoacaoComRelacoes,
  IDoacoesRepository,
  ListarDoacoesParams,
  ObterRelatorioParams,
  RelatorioDoacoesDados,
} from './doacoes.repository.interface';

@Injectable()
export class DoacoesPrismaRepository implements IDoacoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelacoes = {
    doador: true,
    registradoPor: {
      select: {
        id: true,
        nome: true,
        email: true,
      },
    },
  };

  async criar(data: CriarDoacaoData): Promise<DoacaoComRelacoes> {
    return this.prisma.doacao.create({
      data: {
        tipo: data.tipo,
        valor:
          data.valor !== undefined && data.valor !== null
            ? new Prisma.Decimal(data.valor.toString())
            : null,
        quantidade:
          data.quantidade !== undefined && data.quantidade !== null
            ? new Prisma.Decimal(data.quantidade.toString())
            : null,
        unidadeMedida: data.unidadeMedida,
        descricao: data.descricao,
        dataRecebimento: data.dataRecebimento,
        doadorId: data.doadorId,
        registradoPorId: data.registradoPorId,
      },
      include: this.includeRelacoes,
    }) as Promise<DoacaoComRelacoes>;
  }

  async buscarPorId(id: string): Promise<DoacaoComRelacoes | null> {
    return this.prisma.doacao.findUnique({
      where: { id },
      include: this.includeRelacoes,
    }) as Promise<DoacaoComRelacoes | null>;
  }

  async listar(params: ListarDoacoesParams) {
    const where: Prisma.DoacaoWhereInput = {
      ativo: true,
    };

    if (params.tipo) {
      where.tipo = params.tipo;
    }

    if (params.doadorId) {
      where.doadorId = params.doadorId;
    }

    if (params.busca) {
      const cleanBusca = params.busca.replace(/\D/g, '');
      where.OR = [
        { descricao: { contains: params.busca, mode: 'insensitive' } },
        { unidadeMedida: { contains: params.busca, mode: 'insensitive' } },
        {
          doador: {
            nomeRazaoSocial: { contains: params.busca, mode: 'insensitive' },
          },
        },
        ...(cleanBusca
          ? [
              {
                doador: {
                  cpfCnpj: {
                    contains: cleanBusca,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ]
          : []),
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.doacao.findMany({
        skip: params.skip,
        take: params.take,
        where,
        include: this.includeRelacoes,
        orderBy: [{ dataRecebimento: 'desc' }, { criadoEm: 'desc' }],
      }),
      this.prisma.doacao.count({ where }),
    ]);

    return { data: data as DoacaoComRelacoes[], total };
  }

  async obterRelatorio(
    params: ObterRelatorioParams,
  ): Promise<RelatorioDoacoesDados> {
    const where: Prisma.DoacaoWhereInput = {
      ativo: true,
    };

    if (params.tipo) {
      where.tipo = params.tipo;
    }

    if (params.dataInicio || params.dataFim) {
      where.dataRecebimento = {};
      if (params.dataInicio) {
        where.dataRecebimento.gte = new Date(
          `${params.dataInicio}T00:00:00.000Z`,
        );
      }
      if (params.dataFim) {
        where.dataRecebimento.lte = new Date(`${params.dataFim}T23:59:59.999Z`);
      }
    }

    // 1. Total recebido em dinheiro
    let totalDinheiro = 0;
    if (!params.tipo || params.tipo === TipoDoacao.DINHEIRO) {
      const somaDinheiro = await this.prisma.doacao.aggregate({
        _sum: { valor: true },
        where: {
          ...where,
          tipo: TipoDoacao.DINHEIRO,
        },
      });
      totalDinheiro = somaDinheiro._sum.valor
        ? Number(somaDinheiro._sum.valor)
        : 0;
    }

    // 2. Soma acumulada por tipo de item
    let itensAgrupados: AgrupamentoItemDoacao[] = [];
    if (params.tipo !== TipoDoacao.DINHEIRO) {
      const grupos = await this.prisma.doacao.groupBy({
        by: ['tipo', 'unidadeMedida'],
        _sum: { quantidade: true },
        where: {
          ...where,
          tipo: params.tipo ? params.tipo : { not: TipoDoacao.DINHEIRO },
        },
        orderBy: [{ tipo: 'asc' }],
      });

      itensAgrupados = grupos.map((g) => ({
        tipo: g.tipo,
        quantidadeTotal: g._sum.quantidade ? Number(g._sum.quantidade) : 0,
        unidadeMedida: g.unidadeMedida ?? null,
      }));
    }

    // 3. Doações e total de registros
    const [totalRegistros, doacoes] = await Promise.all([
      this.prisma.doacao.count({ where }),
      this.prisma.doacao.findMany({
        where,
        include: this.includeRelacoes,
        orderBy: [{ dataRecebimento: 'desc' }, { criadoEm: 'desc' }],
      }),
    ]);

    return {
      totalDinheiro,
      itensAgrupados,
      totalRegistros,
      doacoes: doacoes as DoacaoComRelacoes[],
    };
  }
}
