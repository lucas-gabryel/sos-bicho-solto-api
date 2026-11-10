import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { MovimentacaoEstoque } from '../entities/movimentacao-estoque.entity';
import {
  CriarMovimentacaoData,
  IEstoqueRepository,
  ListarMovimentacoesFiltro,
} from './estoque.repository.interface';
import { calcularSaldoDeMovimentacoes } from '../utils/estoque.utils';

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

  async criar(
    data: CriarMovimentacaoData,
    tx?: Prisma.TransactionClient,
  ): Promise<MovimentacaoEstoque> {
    const client = tx ?? this.prisma;
    const criada = await client.movimentacaoEstoque.create({
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
      select: {
        id: true,
        tipo: true,
        tipoItem: true,
        descricaoItem: true,
        quantidade: true,
        unidadeMedida: true,
        motivo: true,
        dataMovimento: true,
        doacaoId: true,
        registradoPorId: true,
        ativo: true,
        criadoEm: true,
        modificadoEm: true,
      },
      orderBy: [
        { dataMovimento: 'asc' },
        { criadoEm: 'asc' },
        { id: 'asc' },
      ],
    });

    return items.map((item) => ({
      ...item,
      quantidade: Number(item.quantidade),
      registradoPorNome: null,
    }));
  }

  async calcularSaldoItem(
    tipoItem: Prisma.MovimentacaoEstoqueWhereInput['tipoItem'],
    descricaoItem: string,
    unidadeMedida: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.Decimal> {
    const client = tx ?? this.prisma;
    const movimentacoes = await client.movimentacaoEstoque.findMany({
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
      orderBy: [
        { dataMovimento: 'asc' },
        { criadoEm: 'asc' },
        { id: 'asc' },
      ],
    });

    return calcularSaldoDeMovimentacoes(movimentacoes);
  }

  async bloquearItemParaMovimentacao(
    chaveItem: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${chaveItem}))`;
  }

  async executarTransacao<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}

