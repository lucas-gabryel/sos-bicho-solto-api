import { Injectable } from '@nestjs/common';
import { Doador, Prisma } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  AtualizarDoadorData,
  CriarDoadorData,
  IDoadoresRepository,
  ListarDoadoresParams,
} from './doadores.repository.interface';

@Injectable()
export class DoadoresPrismaRepository implements IDoadoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarDoadorData): Promise<Doador> {
    return this.prisma.doador.create({ data });
  }

  async buscarPorId(id: string): Promise<Doador | null> {
    return this.prisma.doador.findUnique({ where: { id } });
  }

  async buscarPorCpfCnpj(cpfCnpj: string): Promise<Doador | null> {
    return this.prisma.doador.findUnique({
      where: { cpfCnpj: cpfCnpj.replace(/\D/g, '') },
    });
  }

  async listar(params: ListarDoadoresParams) {
    const where: Prisma.DoadorWhereInput = {
      ativo: true,
    };

    if (params.busca) {
      const cleanBusca = params.busca.replace(/\D/g, '');
      where.OR = [
        { nomeRazaoSocial: { contains: params.busca, mode: 'insensitive' } },
        ...(cleanBusca
          ? [
              {
                cpfCnpj: { contains: cleanBusca, mode: 'insensitive' as const },
              },
            ]
          : []),
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.doador.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.doador.count({ where }),
    ]);

    return { data, total };
  }

  async atualizar(id: string, data: AtualizarDoadorData): Promise<Doador> {
    return this.prisma.doador.update({
      where: { id },
      data,
    });
  }

  async excluir(id: string, modificadoPorId: string): Promise<Doador> {
    return this.prisma.doador.update({
      where: { id },
      data: {
        ativo: false,
        modificadoPorId,
      },
    });
  }
}
