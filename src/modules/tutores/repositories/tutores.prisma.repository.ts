import { Injectable } from '@nestjs/common';
import { PrismaService } from '#src/database/prisma.service';
import { Tutor, Prisma } from '@prisma/client';
import {
  CriarTutorData,
  AtualizarTutorData,
  ListarTutoresParams,
  ITutoresRepository,
} from './tutores.repository.interface';

@Injectable()
export class TutoresPrismaRepository implements ITutoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarTutorData): Promise<Tutor> {
    return this.prisma.tutor.create({
      data,
    });
  }

  async buscarPorId(id: string): Promise<Tutor | null> {
    return this.prisma.tutor.findUnique({
      where: { id },
    });
  }

  async buscarPorCpf(cpf: string): Promise<Tutor | null> {
    return this.prisma.tutor.findUnique({
      where: { cpf },
    });
  }

  async buscarPorEmail(email: string): Promise<Tutor | null> {
    return this.prisma.tutor.findUnique({
      where: { email },
    });
  }

  async listar(params: ListarTutoresParams) {
    const where: Prisma.TutorWhereInput = {
      ativo: true,
    };

    if (params.busca) {
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { cpf: { contains: params.busca, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tutor.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.tutor.count({ where }),
    ]);

    return { data, total };
  }

  async atualizar(id: string, data: AtualizarTutorData): Promise<Tutor> {
    return this.prisma.tutor.update({
      where: { id },
      data,
    });
  }

  async excluir(id: string, modificadoPorId: string): Promise<Tutor> {
    return this.prisma.tutor.update({
      where: { id },
      data: {
        ativo: false,
        modificadoPorId,
      },
    });
  }
}
