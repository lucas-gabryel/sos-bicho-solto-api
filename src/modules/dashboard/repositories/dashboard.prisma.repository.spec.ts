import { PrismaService } from '#src/database/prisma.service';
import { DashboardPrismaRepository } from './dashboard.prisma.repository';

describe('DashboardPrismaRepository', () => {
  const tutorCounts: Record<string, number> = {
    todos: 12,
    tutores: 2,
    adotantes: 10,
  };

  const prisma = {
    animal: { count: jest.fn() },
    tutor: {
      count: jest.fn(({ where }: { where: { animais?: object } }) => {
        if (!where.animais) return Promise.resolve(tutorCounts.todos);
        return Promise.resolve(
          'some' in where.animais ? tutorCounts.tutores : tutorCounts.adotantes,
        );
      }),
    },
    $transaction: jest.fn((ops: Promise<number>[]) => Promise.all(ops)),
  };

  const repository = new DashboardPrismaRepository(
    prisma as unknown as PrismaService,
  );

  it('conta acolhedores, tutores (com animal ativo) e adotantes (sem animal ativo)', async () => {
    prisma.animal.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const resumo = await repository.obterResumo();

    expect(resumo).toEqual({
      totalAnimais: 5,
      emAcolhimento: 3,
      adotados: 2,
      acolhedores: 12,
      tutores: 2,
      adotantes: 10,
    });
    expect(prisma.tutor.count).toHaveBeenCalledWith({
      where: { ativo: true, animais: { some: { ativo: true } } },
    });
    expect(prisma.tutor.count).toHaveBeenCalledWith({
      where: { ativo: true, animais: { none: { ativo: true } } },
    });
  });
});
