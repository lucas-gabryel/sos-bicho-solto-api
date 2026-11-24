import { EspecieAnimal, Prisma } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { SituacaoAcolhedor } from '#src/modules/tutores/enums/situacao-acolhedor.enum';
import { RelatoriosPrismaRepository } from './relatorios.prisma.repository';

describe('RelatoriosPrismaRepository', () => {
  const prisma = {
    animal: {
      findMany: jest.fn<Promise<unknown[]>, [Prisma.AnimalFindManyArgs]>(),
    },
    tutor: {
      findMany: jest.fn<Promise<unknown[]>, [Prisma.TutorFindManyArgs]>(),
    },
    usuario: { findUnique: jest.fn() },
  };
  const repository = new RelatoriosPrismaRepository(
    prisma as unknown as PrismaService,
  );

  const adocao = {
    dataAdocao: new Date('2026-11-15T12:00Z'),
    devolvidoEm: null,
    observacoes: null,
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

  it('busca só animais ativos e converte pesos decimais', async () => {
    prisma.animal.findMany.mockResolvedValue([
      {
        numeroRegistro: '05.11.2026.1',
        nome: 'Mia',
        especie: EspecieAnimal.GATO,
        pesoInicial: new Prisma.Decimal('3.5'),
        pesoAtual: null,
        tutor: null,
        eventos: [
          {
            dataEvento: new Date('2026-11-05T12:00Z'),
            tipo: 'ENTRADA',
            motivoSaida: null,
            descricao: 'Entrada na ONG',
            automatico: true,
            criadoPor: { nome: 'Paula Freitas' },
          },
        ],
        adocoes: [adocao],
      },
    ]);

    const [animal] = await repository.buscarAnimais(EspecieAnimal.GATO);

    expect(prisma.animal.findMany.mock.calls[0][0].where).toEqual({
      ativo: true,
      especie: EspecieAnimal.GATO,
    });
    expect(animal.pesoInicial).toBe(3.5);
    expect(animal.pesoAtual).toBeNull();
    expect(animal.eventos[0].registradoPor).toBe('Paula Freitas');
    expect(animal.adocoes[0]).toMatchObject({
      protetor: 'Paula Freitas',
      animal: { entradas: [new Date('2026-11-05T12:00Z')] },
    });
  });

  it.each([
    [SituacaoAcolhedor.TUTOR, { some: { ativo: true } }],
    [SituacaoAcolhedor.ADOTANTE, { none: { ativo: true } }],
  ])(
    'usa a regra de situação do cadastro para %s',
    async (situacao, animais) => {
      prisma.tutor.findMany.mockResolvedValue([]);

      await repository.buscarAcolhedores(situacao);

      expect(prisma.tutor.findMany.mock.calls.at(-1)?.[0].where).toEqual({
        ativo: true,
        animais,
      });
    },
  );

  it('retorna o nome do usuário que gerou o relatório', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ nome: 'Malba Vinicius' });

    await expect(repository.buscarNomeUsuario('id')).resolves.toBe(
      'Malba Vinicius',
    );
  });
});
