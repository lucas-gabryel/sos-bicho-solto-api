import { EspecieAnimal, Prisma, TipoDoacao } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { RelatoriosPrismaRepository } from './relatorios.prisma.repository';

describe('RelatoriosPrismaRepository', () => {
  const prisma = {
    animal: {
      findMany: jest.fn<Promise<unknown[]>, [Prisma.AnimalFindManyArgs]>(),
    },
    tutor: {
      findMany: jest.fn<Promise<unknown[]>, [Prisma.TutorFindManyArgs]>(),
    },
    doacao: { findMany: jest.fn<Promise<unknown[]>, []>() },
    movimentacaoEstoque: {
      findMany: jest.fn<
        Promise<unknown[]>,
        [Prisma.MovimentacaoEstoqueFindManyArgs]
      >(),
    },
    usuario: { findUnique: jest.fn() },
  };
  const repository = new RelatoriosPrismaRepository(
    prisma as unknown as PrismaService,
  );

  const adocao = {
    dataAdocao: new Date('2026-11-15T12:00Z'),
    devolvidoEm: null,
    observacoesDevolucao: null,
    protetor: { nome: 'Paula Freitas' },
    tutor: { codigo: 1, nome: 'Ana Clara' },
    animal: {
      nome: 'Mia',
      numeroRegistro: '05.11.2026.1',
      especie: EspecieAnimal.GATO,
      criadoEm: new Date('2026-11-05T12:00Z'),
      eventos: [{ dataEvento: new Date('2026-11-05T12:00Z') }],
    },
  };

  it('busca só animais ativos e achata as entradas de cada adoção', async () => {
    prisma.animal.findMany.mockResolvedValue([
      { nome: 'Mia', especie: EspecieAnimal.GATO, adocoes: [adocao] },
    ]);

    const [animal] = await repository.buscarAnimais(EspecieAnimal.GATO);

    expect(prisma.animal.findMany.mock.calls[0][0].where).toEqual({
      ativo: true,
      especie: EspecieAnimal.GATO,
    });
    expect(animal.adocoes[0]).toMatchObject({
      protetor: 'Paula Freitas',
      animal: { entradas: [new Date('2026-11-05T12:00Z')] },
    });
  });

  it('busca todos os acolhedores ativos com os animais vinculados', async () => {
    prisma.tutor.findMany.mockResolvedValue([
      {
        codigo: 1,
        nome: 'Ana Clara',
        adocoes: [adocao],
        animais: [{ nome: 'Mia' }],
      },
    ]);

    const [acolhedor] = await repository.buscarAcolhedores();
    const args = prisma.tutor.findMany.mock.calls[0][0];

    expect(args.where).toEqual({ ativo: true });
    expect(args.select?.animais).toMatchObject({ where: { ativo: true } });
    expect(acolhedor.animaisVinculados).toEqual([{ nome: 'Mia' }]);
  });

  it('converte decimais e ancora a data de recebimento ao meio-dia local', async () => {
    prisma.doacao.findMany.mockResolvedValue([
      {
        tipo: TipoDoacao.DINHEIRO,
        valor: new Prisma.Decimal('150.50'),
        quantidade: null,
        unidadeMedida: null,
        descricao: null,
        dataRecebimento: new Date('2026-11-01T00:00:00Z'),
        doador: { id: 'joana', nomeRazaoSocial: 'Joana Pereira' },
      },
    ]);

    const [doacao] = await repository.buscarDoacoes();

    expect(doacao.valor).toBe(150.5);
    expect(doacao.dataRecebimento).toEqual(new Date('2026-11-01T15:00:00Z'));
    expect(doacao.doador).toEqual({ id: 'joana', nome: 'Joana Pereira' });
  });

  it('busca movimentações de estoque em ordem cronológica', async () => {
    prisma.movimentacaoEstoque.findMany.mockResolvedValue([
      { quantidade: new Prisma.Decimal('2.5') },
    ]);

    const [movimento] = await repository.buscarMovimentacoesEstoque();

    expect(prisma.movimentacaoEstoque.findMany.mock.calls[0][0]).toMatchObject({
      where: { ativo: true },
      orderBy: [{ dataMovimento: 'asc' }, { criadoEm: 'asc' }, { id: 'asc' }],
    });
    expect(movimento.quantidade).toBe(2.5);
  });

  it('retorna o nome do usuário que gerou o relatório', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ nome: 'Malba Vinicius' });

    await expect(repository.buscarNomeUsuario('id')).resolves.toBe(
      'Malba Vinicius',
    );
  });
});
