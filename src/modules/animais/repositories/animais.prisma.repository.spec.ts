import {
  EspecieAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { AnimaisPrismaRepository } from './animais.prisma.repository';

describe('AnimaisPrismaRepository', () => {
  const tx = {
    animal: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    fotoAnimal: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    eventoAnimal: {
      createMany: jest.fn<
        unknown,
        [
          {
            data: Array<{
              animalId: string;
              tipo: TipoEventoAnimal;
              descricao: string;
              documentoUrl?: string | null;
              documentoTipo?: string | null;
              automatico: boolean;
              criadoPorId: string;
            }>;
          },
        ]
      >(),
      create: jest.fn<unknown, [{ data: Record<string, unknown> }]>(),
    },
  };

  const prisma = {
    $transaction: jest.fn((cb: (client: typeof tx) => unknown) => cb(tx)),
    animal: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
    eventoAnimal: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const repository = new AnimaisPrismaRepository(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criar', () => {
    it('cria automaticamente eventos de ENTRADA, MEDICO inicial e FOTO extra na transação', async () => {
      const criadoEm = new Date('2026-11-17T10:00:00.000Z');
      tx.animal.count.mockResolvedValue(0);
      tx.animal.create.mockResolvedValue({
        id: 'animal-1',
        criadoEm,
      });
      tx.animal.findUniqueOrThrow.mockResolvedValue({
        id: 'animal-1',
        fotos: [],
        eventos: [],
      });

      await repository.criar(
        {
          nome: 'Rex',
          especie: EspecieAnimal.CAO,
          raca: 'SRD',
          sexo: SexoAnimal.MACHO,
          cor: 'Caramelo',
          pesoInicial: 8.5,
          vacinado: true,
          castrado: false,
          localResgate: 'Centro, Arapiraca/AL',
          observacoes: 'Apresenta leve desidratação',
          fotos: [
            { url: 'https://exemplo.com/principal.jpg', principal: true },
            { url: 'https://exemplo.com/secundaria.png', principal: false },
          ],
        },
        'usuario-1',
      );

      expect(tx.eventoAnimal.createMany).toHaveBeenCalledTimes(1);
      const { data: eventosCriados } =
        tx.eventoAnimal.createMany.mock.calls[0][0];

      expect(eventosCriados).toHaveLength(3);
      expect(eventosCriados[0]).toMatchObject({
        animalId: 'animal-1',
        tipo: TipoEventoAnimal.ENTRADA,
        documentoUrl: 'https://exemplo.com/principal.jpg',
        automatico: true,
        criadoPorId: 'usuario-1',
      });
      expect(eventosCriados[1].tipo).toBe(TipoEventoAnimal.MEDICO);
      expect(eventosCriados[1].descricao).toContain(
        'peso 8.5 kg, vacinado, não castrado',
      );
      expect(eventosCriados[2]).toMatchObject({
        animalId: 'animal-1',
        tipo: TipoEventoAnimal.FOTO,
        documentoUrl: 'https://exemplo.com/secundaria.png',
        documentoTipo: 'image/png',
        automatico: true,
        criadoPorId: 'usuario-1',
      });
    });
  });

  describe('adicionarFoto', () => {
    it('registra evento automático de FOTO ao adicionar nova foto', async () => {
      const criadoEm = new Date('2026-11-17T12:00:00.000Z');
      tx.fotoAnimal.create.mockResolvedValue({
        id: 'foto-nova',
        animalId: 'animal-1',
        url: 'https://exemplo.com/nova-foto.webp',
        principal: true,
        criadoEm,
      });

      await repository.adicionarFoto(
        'animal-1',
        'https://exemplo.com/nova-foto.webp',
        true,
        'usuario-1',
      );

      expect(tx.eventoAnimal.create).toHaveBeenCalledTimes(1);
      const { data: eventoFoto } = tx.eventoAnimal.create.mock.calls[0][0];
      expect(eventoFoto).toMatchObject({
        animalId: 'animal-1',
        tipo: TipoEventoAnimal.FOTO,
        documentoUrl: 'https://exemplo.com/nova-foto.webp',
        documentoTipo: 'image/webp',
        automatico: true,
        criadoPorId: 'usuario-1',
      });
    });
  });

  describe('adicionarEvento', () => {
    it('atualiza o status do animal quando novoStatusAnimal é informado', async () => {
      tx.eventoAnimal.create.mockResolvedValue({
        id: 'ev-1',
        animalId: 'animal-1',
        tipo: TipoEventoAnimal.SAIDA,
      });

      await repository.adicionarEvento('animal-1', {
        tipo: TipoEventoAnimal.SAIDA,
        descricao: 'Transferido para abrigo parceiro',
        criadoPorId: 'usuario-1',
        novoStatusAnimal: StatusAnimal.TRANSFERIDO,
      });

      expect(tx.animal.update).toHaveBeenCalledWith({
        where: { id: 'animal-1' },
        data: {
          status: StatusAnimal.TRANSFERIDO,
          modificadoPorId: 'usuario-1',
        },
      });
      expect(tx.eventoAnimal.create).toHaveBeenCalled();
    });
  });
});
