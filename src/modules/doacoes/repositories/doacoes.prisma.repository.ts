import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  async criar(data: CriarDoacaoData): Promise<DoacaoComRelacoes> {
    return this.prisma.doacao.create({
      data: {
        tipo: data.tipo,
        valor: data.valor !== undefined && data.valor !== null ? new Prisma.Decimal(data.valor.toString()) : null,
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
                  cpfCnpj: { contains: cleanBusca, mode: 'insensitive' as const },
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
}
