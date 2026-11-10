import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { MovimentacaoEstoque } from '../entities/movimentacao-estoque.entity';
import {
  CriarMovimentacaoData,
  IEstoqueRepository,
  ListarMovimentacoesFiltro,
} from './estoque.repository.interface';

@Injectable()
export class EstoquePrismaRepository implements IEstoqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelacoes = {
    registradoPor: {
      select: {
        id: true,
        nome: true,
        email: true,
      },
    },
  };

  async criar(data: CriarMovimentacaoData): Promise<MovimentacaoEstoque> {
    const criada = await this.prisma.movimentacaoEstoque.create({
      data: {
        tipo: data.tipo,
        tipoItem: data.tipoItem,
        descricaoItem: data.descricaoItem,
        quantidade: new Prisma.Decimal(data.quantidade.toString()),
        unidadeMedida: data.unidadeMedida,
        motivo: data.motivo,
        doacaoId: data.doacaoId ?? null,
        registradoPorId: data.registradoPorId ?? null,
        dataMovimento: data.dataMovimento ?? new Date(),
      },
      include: this.includeRelacoes,
    });

    return {
      ...criada,
      quantidade: Number(criada.quantidade),
      registradoPorNome: criada.registradoPor?.nome ?? null,
    };
  }

  async buscarPorId(id: string): Promise<MovimentacaoEstoque | null> {
    const item = await this.prisma.movimentacaoEstoque.findUnique({
      where: { id },
      include: this.includeRelacoes,
    });

    if (!item) return null;

    return {
      ...item,
      quantidade: Number(item.quantidade),
      registradoPorNome: item.registradoPor?.nome ?? null,
    };
  }

  async listar(
    filtro: ListarMovimentacoesFiltro,
  ): Promise<{ data: MovimentacaoEstoque[]; total: number }> {
    const where: Prisma.MovimentacaoEstoqueWhereInput = {
      ativo: true,
    };

    if (filtro.tipo) {
      where.tipo = filtro.tipo;
    }

    if (filtro.tipoItem) {
      where.tipoItem = filtro.tipoItem;
    }

    if (filtro.busca) {
      where.OR = [
        { descricaoItem: { contains: filtro.busca, mode: 'insensitive' } },
        { motivo: { contains: filtro.busca, mode: 'insensitive' } },
        { unidadeMedida: { contains: filtro.busca, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.movimentacaoEstoque.findMany({
        where,
        skip: filtro.skip,
        take: filtro.take,
        include: this.includeRelacoes,
        orderBy: [{ dataMovimento: 'desc' }, { criadoEm: 'desc' }],
      }),
      this.prisma.movimentacaoEstoque.count({ where }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        quantidade: Number(item.quantidade),
        registradoPorNome: item.registradoPor?.nome ?? null,
      })),
      total,
    };
  }

  async obterTodasAtivas(): Promise<MovimentacaoEstoque[]> {
    const items = await this.prisma.movimentacaoEstoque.findMany({
      where: { ativo: true },
      include: this.includeRelacoes,
      orderBy: [{ dataMovimento: 'asc' }],
    });

    return items.map((item) => ({
      ...item,
      quantidade: Number(item.quantidade),
      registradoPorNome: item.registradoPor?.nome ?? null,
    }));
  }

  async calcularSaldoItem(
    tipoItem: Prisma.MovimentacaoEstoqueWhereInput['tipoItem'],
    descricaoItem: string,
    unidadeMedida: string,
  ): Promise<number> {
    const movimentacoes = await this.prisma.movimentacaoEstoque.findMany({
      where: {
        ativo: true,
        tipoItem,
        descricaoItem: { equals: descricaoItem, mode: 'insensitive' },
        unidadeMedida: { equals: unidadeMedida, mode: 'insensitive' },
      },
      select: {
        tipo: true,
        quantidade: true,
      },
    });

    let saldo = 0;
    for (const mov of movimentacoes) {
      const qtd = Number(mov.quantidade);
      if (mov.tipo === 'ENTRADA') {
        saldo += qtd;
      } else if (mov.tipo === 'SAIDA') {
        saldo -= qtd;
      } else if (mov.tipo === 'AJUSTE') {
        saldo = qtd;
      }
    }

    return Math.max(0, saldo);
  }
}

