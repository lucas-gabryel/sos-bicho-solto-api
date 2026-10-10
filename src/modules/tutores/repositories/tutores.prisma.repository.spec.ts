import { PrismaService } from '#src/database/prisma.service';
import { SituacaoAcolhedor } from '../enums/situacao-acolhedor.enum';
import { ANIMAIS_VINCULADOS_WHERE } from './filtro-situacao';
import { TutoresPrismaRepository } from './tutores.prisma.repository';

describe('TutoresPrismaRepository', () => {
  const prisma = {
    tutor: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const repository = new TutoresPrismaRepository(
    prisma as unknown as PrismaService,
  );

  describe('listar', () => {
    it('aplica o filtro de situação junto com a busca na listagem e na contagem', async () => {
      await repository.listar({
        skip: 0,
        take: 10,
        busca: 'ana',
        situacao: SituacaoAcolhedor.TUTOR,
      });

      const where = {
        ativo: true,
        animais: { some: { ativo: true } },
        OR: [{ nome: { contains: 'ana', mode: 'insensitive' } }],
      };

      expect(prisma.tutor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.tutor.count).toHaveBeenCalledWith({ where });
    });

    it('lista adotantes como acolhedores sem animal ativo vinculado', async () => {
      await repository.listar({
        skip: 0,
        take: 10,
        situacao: SituacaoAcolhedor.ADOTANTE,
      });

      const where = { ativo: true, animais: { none: { ativo: true } } };

      expect(prisma.tutor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.tutor.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('buscarPorId', () => {
    it('conta animais vinculados com o mesmo critério do filtro de situação', async () => {
      await repository.buscarPorId('tutor-1');

      expect(prisma.tutor.findUnique).toHaveBeenCalledWith({
        where: { id: 'tutor-1' },
        include: {
          _count: { select: { animais: { where: ANIMAIS_VINCULADOS_WHERE } } },
        },
      });
    });
  });
});
