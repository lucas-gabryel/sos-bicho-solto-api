import { MotivoSaidaAnimal, TipoEventoAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { AdocoesPrismaRepository } from './adocoes.prisma.repository';

describe('AdocoesPrismaRepository', () => {
  const tx = {
    animal: {
      updateMany: jest.fn(),
    },
    tutor: {
      findUnique: jest.fn(),
    },
    adocao: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    eventoAnimal: {
      create: jest.fn<unknown, [{ data: Record<string, unknown> }]>(),
    },
  };

  const prisma = {
    $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
  };

  const repository = new AdocoesPrismaRepository(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registra evento automático de SAIDA (ADOCAO) ao registrar adoção', async () => {
    const dataAdocao = new Date('2026-11-17T11:00:00.000Z');
    tx.animal.updateMany.mockResolvedValue({ count: 1 });
    tx.tutor.findUnique.mockResolvedValue({ nome: 'Ana Clara' });
    tx.adocao.create.mockResolvedValue({
      id: 'adocao-1',
      animalId: 'animal-1',
      tutorId: 'tutor-1',
      protetorId: 'protetor-1',
      dataAdocao,
    });

    await repository.registrar({
      animalId: 'animal-1',
      tutorId: 'tutor-1',
      protetorId: 'protetor-1',
      observacoes: 'Adoção responsável',
    });

    expect(tx.eventoAnimal.create).toHaveBeenCalledTimes(1);
    const { data: eventoSaida } = tx.eventoAnimal.create.mock.calls[0][0];
    expect(eventoSaida).toMatchObject({
      animalId: 'animal-1',
      tipo: TipoEventoAnimal.SAIDA,
      motivoSaida: MotivoSaidaAnimal.ADOCAO,
      descricao:
        'Saída da ONG por adoção (tutor: Ana Clara). Observações: Adoção responsável.',
      dataEvento: dataAdocao,
      automatico: true,
      criadoPorId: 'protetor-1',
    });
  });

  it('registra evento automático de ENTRADA ao devolver adoção', async () => {
    const devolvidoEm = new Date('2026-11-18T11:00:00.000Z');
    tx.adocao.updateMany.mockResolvedValue({ count: 1 });
    tx.animal.updateMany.mockResolvedValue({ count: 1 });
    tx.adocao.findUniqueOrThrow.mockResolvedValue({
      id: 'adocao-1',
      animalId: 'animal-1',
      tutorId: 'tutor-1',
      devolvidoEm,
    });

    await repository.devolver({
      id: 'adocao-1',
      animalId: 'animal-1',
      tutorId: 'tutor-1',
      devolvidoPorId: 'protetor-1',
      observacoesDevolucao: 'Mudança de apartamento',
    });

    expect(tx.eventoAnimal.create).toHaveBeenCalledTimes(1);
    const { data: eventoEntrada } = tx.eventoAnimal.create.mock.calls[0][0];
    expect(eventoEntrada).toMatchObject({
      animalId: 'animal-1',
      tipo: TipoEventoAnimal.ENTRADA,
      descricao:
        'Retorno ao acolhimento na ONG por devolução de adoção. Observações: Mudança de apartamento.',
      dataEvento: devolvidoEm,
      automatico: true,
      criadoPorId: 'protetor-1',
    });
  });
});
