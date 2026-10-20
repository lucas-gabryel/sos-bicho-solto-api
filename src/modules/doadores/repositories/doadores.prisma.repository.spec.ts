import { PrismaService } from '#src/database/prisma.service';
import { DoadoresPrismaRepository } from './doadores.prisma.repository';

describe('DoadoresPrismaRepository', () => {
  const prisma = {
    doador: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const repository = new DoadoresPrismaRepository(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('filtra por nomeRazaoSocial quando a busca contém apenas texto', async () => {
      await repository.listar({
        skip: 0,
        take: 10,
        busca: 'Amigo Fiel',
      });

      const where = {
        ativo: true,
        OR: [
          { nomeRazaoSocial: { contains: 'Amigo Fiel', mode: 'insensitive' } },
        ],
      };

      expect(prisma.doador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.doador.count).toHaveBeenCalledWith({ where });
    });

    it('filtra por nomeRazaoSocial ou cpfCnpj quando a busca contém dígitos', async () => {
      await repository.listar({
        skip: 0,
        take: 10,
        busca: '11.222.333',
      });

      const where = {
        ativo: true,
        OR: [
          { nomeRazaoSocial: { contains: '11.222.333', mode: 'insensitive' } },
          { cpfCnpj: { contains: '11222333', mode: 'insensitive' } },
        ],
      };

      expect(prisma.doador.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
      expect(prisma.doador.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('buscarPorCpfCnpj', () => {
    it('normaliza o documento removendo caracteres não numéricos antes de buscar', async () => {
      await repository.buscarPorCpfCnpj('11.222.333/0001-81');

      expect(prisma.doador.findUnique).toHaveBeenCalledWith({
        where: { cpfCnpj: '11222333000181' },
      });
    });
  });
});
