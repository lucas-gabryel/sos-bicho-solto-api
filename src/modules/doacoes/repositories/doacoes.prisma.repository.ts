import { Injectable } from '@nestjs/common';
import { DirecaoDoacao, Prisma, TipoDoacao } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  CriarDoacaoData,
  DoacaoComRelacoes,
  IDoacoesRepository,
  ListarDoacoesParams,
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

  async criar(
    data: CriarDoacaoData,
    tx?: Prisma.TransactionClient,
  ): Promise<DoacaoComRelacoes> {
    const client = tx ?? this.prisma;
    return client.doacao.create({
      data: {
        tipo: data.tipo,
        direcao: data.direcao ?? DirecaoDoacao.RECEBIDA,
        valor: data.valor !== undefined && data.valor !== null ? new Prisma.Decimal(data.valor.toString()) : null,
        quantidade:
          data.quantidade !== undefined && data.quantidade !== null
            ? new Prisma.Decimal(data.quantidade.toString())
            : null,
        unidadeMedida: data.unidadeMedida,
        descricao: data.descricao,
        beneficiario: data.beneficiario,
        dataRecebimento: data.dataRecebimento,
        doadorId: data.doadorId,
        registradoPorId: data.registradoPorId,
        documentoUrl: data.documentoUrl,
        documentoNome: data.documentoNome,
        documentoTipo: data.documentoTipo,
      },
      include: this.includeRelacoes,
    }) as Promise<DoacaoComRelacoes>;
  }

  async executarTransacao<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
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

    if (params.direcao) {
      where.direcao = params.direcao;
    }

    if (params.doadorId) {
      where.doadorId = params.doadorId;
    }

    if (params.busca) {
      const trimmedBusca = params.busca.trim();
      const cleanBusca = trimmedBusca.replace(/\D/g, '');
      const isDocumentSearch =
        cleanBusca.length >= 8 &&
        cleanBusca.length <= 14 &&
        /^[0-9.\-/ ]+$/.test(trimmedBusca);

      where.OR = [
        { descricao: { contains: params.busca, mode: 'insensitive' } },
        { beneficiario: { contains: params.busca, mode: 'insensitive' } },
        { unidadeMedida: { contains: params.busca, mode: 'insensitive' } },
        {
          doador: {
            nomeRazaoSocial: { contains: params.busca, mode: 'insensitive' },
          },
        },
        ...(isDocumentSearch
          ? [
              {
                doador: {
                  cpfCnpj: { contains: cleanBusca, mode: 'insensitive' as const },
                },
              },
            ]
          : []),
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.doacao.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ dataRecebimento: 'desc' }, { criadoEm: 'desc' }],
        include: this.includeRelacoes,
      }),
      this.prisma.doacao.count({ where }),
    ]);

    return {
      data: data as DoacaoComRelacoes[],
      total,
    };
  }

  async buscarParaRelatorio(params: {
    dataInicio?: Date;
    dataFim?: Date;
    tipo?: TipoDoacao;
    direcao?: DirecaoDoacao;
  }): Promise<DoacaoComRelacoes[]> {
    const where: Prisma.DoacaoWhereInput = {
      ativo: true,
    };

    if (params.tipo) {
      where.tipo = params.tipo;
    }

    if (params.direcao) {
      where.direcao = params.direcao;
    }

    if (params.dataInicio || params.dataFim) {
      where.dataRecebimento = {};
      if (params.dataInicio) {
        where.dataRecebimento.gte = params.dataInicio;
      }
      if (params.dataFim) {
        where.dataRecebimento.lte = params.dataFim;
      }
    }

    const data = await this.prisma.doacao.findMany({
      where,
      orderBy: [{ dataRecebimento: 'desc' }, { criadoEm: 'desc' }],
      include: this.includeRelacoes,
    });

    return data as DoacaoComRelacoes[];
  }
}
