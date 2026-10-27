import { TipoDoacao } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { DoacoesPrismaRepository } from './doacoes.prisma.repository';

describe('DoacoesPrismaRepository', () => {
  const prisma = {
    doacao: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _sum: { valor: null } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };

  const repository = new DoacoesPrismaRepository(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obterRelatorio', () => {
    it('executa consultas agregadas e listagem com filtros de período e tipo', async () => {
      prisma.doacao.aggregate.mockResolvedValue({ _sum: { valor: 500 } });
      prisma.doacao.groupBy.mockResolvedValue([
        {
          tipo: TipoDoacao.RACAO,
          unidadeMedida: 'kg',
          _sum: { quantidade: 30 },
        },
      ]);
      prisma.doacao.count.mockResolvedValue(2);
      prisma.doacao.findMany.mockResolvedValue([]);

      const resultado = await repository.obterRelatorio({
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: TipoDoacao.RACAO,
      });

      const groupByCalls = prisma.doacao.groupBy.mock.calls as unknown as Array<
        [{ by: string[]; where: { tipo?: TipoDoacao; ativo?: boolean } }]
      >;

      const chamadoGroupBy = groupByCalls[0][0];
      expect(chamadoGroupBy.by).toEqual(['tipo', 'unidadeMedida']);
      expect(chamadoGroupBy.where.tipo).toBe(TipoDoacao.RACAO);

      expect(prisma.doacao.count).toHaveBeenCalled();
      expect(prisma.doacao.findMany).toHaveBeenCalled();
      expect(resultado.totalDinheiro).toBe(0); // Quando o filtro é RACAO, totalDinheiro não é calculado
      expect(resultado.itensAgrupados).toEqual([
        { tipo: TipoDoacao.RACAO, unidadeMedida: 'kg', quantidadeTotal: 30 },
      ]);
      expect(resultado.totalRegistros).toBe(2);
    });

    it('calcula soma em dinheiro quando filtro for DINHEIRO ou vazio', async () => {
      prisma.doacao.aggregate.mockResolvedValue({ _sum: { valor: 1200 } });
      prisma.doacao.groupBy.mockResolvedValue([]);
      prisma.doacao.count.mockResolvedValue(1);
      prisma.doacao.findMany.mockResolvedValue([]);

      const resultado = await repository.obterRelatorio({
        tipo: TipoDoacao.DINHEIRO,
      });

      const aggregateCalls = prisma.doacao.aggregate.mock
        .calls as unknown as Array<[{ where: { tipo?: TipoDoacao } }]>;
      const chamadoAggregate = aggregateCalls[0][0];
      expect(chamadoAggregate.where.tipo).toBe(TipoDoacao.DINHEIRO);
      expect(resultado.totalDinheiro).toBe(1200);
      expect(resultado.itensAgrupados).toEqual([]);
    });
  });
});
