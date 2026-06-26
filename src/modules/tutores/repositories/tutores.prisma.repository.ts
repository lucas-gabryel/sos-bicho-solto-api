import { Injectable } from '@nestjs/common';
import { PrismaService } from '#src/database/prisma.service';
import { Tutor, Prisma } from '@prisma/client';
import {
  CriarTutorData,
  AtualizarTutorData,
  ListarTutoresParams,
  ITutoresRepository,
  TutorComContagem,
} from './tutores.repository.interface';

// Conta apenas os animais ativos vinculados ao tutor (mesmo critério usado
// na listagem de animais do tutor em GET /tutores/:id/animais).
const INCLUDE_CONTAGEM = {
  _count: { select: { animais: { where: { ativo: true } } } },
} satisfies Prisma.TutorInclude;

type TutorComCount = Tutor & { _count: { animais: number } };

function comContagem(tutor: TutorComCount): TutorComContagem {
  const { _count, ...rest } = tutor;
  return { ...rest, totalAnimaisAdotados: _count.animais };
}

@Injectable()
export class TutoresPrismaRepository implements ITutoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(data: CriarTutorData): Promise<TutorComContagem> {
    const tutor = await this.prisma.tutor.create({
      data,
      include: INCLUDE_CONTAGEM,
    });
    return comContagem(tutor);
  }

  async buscarPorId(id: string): Promise<TutorComContagem | null> {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id },
      include: INCLUDE_CONTAGEM,
    });
    return tutor ? comContagem(tutor) : null;
  }

  async buscarPorCpf(cpf: string): Promise<Tutor | null> {
    return this.prisma.tutor.findUnique({
      where: { cpf: cpf.replace(/\D/g, '') },
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
      const cleanBusca = params.busca.replace(/\D/g, '');
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        ...(cleanBusca
          ? [{ cpf: { contains: cleanBusca, mode: 'insensitive' as const } }]
          : []),
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tutor.findMany({
        skip: params.skip,
        take: params.take,
        where,
        orderBy: { criadoEm: 'desc' },
        include: INCLUDE_CONTAGEM,
      }),
      this.prisma.tutor.count({ where }),
    ]);

    return { data: data.map(comContagem), total };
  }

  async atualizar(
    id: string,
    data: AtualizarTutorData,
  ): Promise<TutorComContagem> {
    const tutor = await this.prisma.tutor.update({
      where: { id },
      data,
      include: INCLUDE_CONTAGEM,
    });
    return comContagem(tutor);
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
