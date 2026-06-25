import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Perfil, StatusAnimal } from '@prisma/client';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  ANIMAIS_REPOSITORY,
  IAnimaisRepository,
} from '#src/modules/animais/repositories/animais.repository.interface';
import {
  ITutoresRepository,
  TUTORES_REPOSITORY,
} from '#src/modules/tutores/repositories/tutores.repository.interface';
import { AdocoesService } from './adocoes.service';
import {
  ADOCOES_REPOSITORY,
  IAdocoesRepository,
} from './repositories/adocoes.repository.interface';
import { FiltrarAdocoesDto } from './dto/filtrar-adocoes.dto';

const usuario: JwtPayload = {
  sub: 'usuario-1',
  email: 'protetor@sosbichosolto.com',
  perfil: Perfil.PROTETOR,
};

const fakeAnimal = (overrides = {}) => ({
  id: 'animal-1',
  numeroRegistro: '24.06.2026.1',
  nome: 'Rex',
  especie: 'CAO',
  raca: 'SRD',
  sexo: 'MACHO',
  porte: null,
  cor: 'Caramelo',
  pesoInicial: 10.5,
  pesoAtual: null,
  dataNascimento: null,
  castrado: false,
  vacinado: true,
  localResgate: 'Centro',
  observacoes: null,
  status: StatusAnimal.ACOLHIMENTO,
  tutorId: null,
  ativo: true,
  criadoEm: new Date('2026-06-24T10:00:00.000Z'),
  criadoPorId: 'usuario-1',
  modificadoEm: new Date('2026-06-24T10:00:00.000Z'),
  modificadoPorId: 'usuario-1',
  fotos: [],
  ...overrides,
});

const fakeTutor = (overrides = {}) => ({
  id: 'tutor-1',
  codigo: 1,
  nome: 'Ana Clara',
  cpf: '39053344705',
  telefone: '(82) 99912-3456',
  email: 'ana@email.com',
  endereco: 'Rua A',
  dataNascimento: new Date('1992-03-15T00:00:00.000Z'),
  ativo: true,
  criadoEm: new Date('2026-06-24T10:00:00.000Z'),
  criadoPorId: 'usuario-1',
  modificadoEm: new Date('2026-06-24T10:00:00.000Z'),
  modificadoPorId: 'usuario-1',
  ...overrides,
});

const fakeAdocao = (overrides = {}) => ({
  id: 'adocao-1',
  animalId: 'animal-1',
  tutorId: 'tutor-1',
  protetorId: 'usuario-1',
  dataAdocao: new Date('2026-06-24T11:00:00.000Z'),
  observacoes: 'Casa com quintal.',
  devolvidoEm: null,
  devolvidoPorId: null,
  observacoesDevolucao: null,
  ...overrides,
});

describe('AdocoesService', () => {
  let service: AdocoesService;
  let adocoesRepository: jest.Mocked<IAdocoesRepository>;
  let animaisRepository: jest.Mocked<IAnimaisRepository>;
  let tutoresRepository: jest.Mocked<ITutoresRepository>;

  beforeEach(async () => {
    const adocoesRepoMock: jest.Mocked<IAdocoesRepository> = {
      buscarPorId: jest.fn(),
      buscarAtivaPorAnimalId: jest.fn(),
      listar: jest.fn(),
      registrar: jest.fn(),
      devolver: jest.fn(),
    };

    const animaisRepoMock = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
      adicionarFoto: jest.fn(),
      removerFoto: jest.fn(),
      definirFotoPrincipal: jest.fn(),
      buscarFotoPorId: jest.fn(),
    } as jest.Mocked<IAnimaisRepository>;

    const tutoresRepoMock: jest.Mocked<ITutoresRepository> = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorCpf: jest.fn(),
      buscarPorEmail: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AdocoesService,
        { provide: ADOCOES_REPOSITORY, useValue: adocoesRepoMock },
        { provide: ANIMAIS_REPOSITORY, useValue: animaisRepoMock },
        { provide: TUTORES_REPOSITORY, useValue: tutoresRepoMock },
      ],
    }).compile();

    service = module.get(AdocoesService);
    adocoesRepository = module.get(ADOCOES_REPOSITORY);
    animaisRepository = module.get(ANIMAIS_REPOSITORY);
    tutoresRepository = module.get(TUTORES_REPOSITORY);
  });

  describe('registrar', () => {
    const dto = {
      animalId: 'animal-1',
      tutorId: 'tutor-1',
      observacoes: 'Casa com quintal.',
    };

    it('registra adoção se animal está disponível e tutor está ativo', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(fakeAnimal());
      tutoresRepository.buscarPorId.mockResolvedValue(fakeTutor());
      adocoesRepository.buscarAtivaPorAnimalId.mockResolvedValue(null);
      adocoesRepository.registrar.mockResolvedValue(fakeAdocao());

      const result = await service.registrar(dto, usuario);

      expect(adocoesRepository.registrar).toHaveBeenCalledWith({
        animalId: 'animal-1',
        tutorId: 'tutor-1',
        protetorId: 'usuario-1',
        observacoes: 'Casa com quintal.',
      });
      expect(result.id).toBe('adocao-1');
      expect(result.animalId).toBe('animal-1');
      expect(result.tutorId).toBe('tutor-1');
    });

    it('bloqueia adoção quando o animal não existe', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.registrar(dto, usuario)).rejects.toThrow(
        NotFoundException,
      );
      expect(adocoesRepository.registrar).not.toHaveBeenCalled();
    });

    it('bloqueia adoção quando o animal já está adotado', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(
        fakeAnimal({ status: StatusAnimal.ADOTADO, tutorId: 'tutor-1' }),
      );

      await expect(service.registrar(dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
      expect(tutoresRepository.buscarPorId).not.toHaveBeenCalled();
      expect(adocoesRepository.registrar).not.toHaveBeenCalled();
    });

    it('bloqueia adoção quando o tutor não existe ou está inativo', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(fakeAnimal());
      tutoresRepository.buscarPorId.mockResolvedValue(
        fakeTutor({ ativo: false }),
      );

      await expect(service.registrar(dto, usuario)).rejects.toThrow(
        NotFoundException,
      );
      expect(adocoesRepository.registrar).not.toHaveBeenCalled();
    });

    it('bloqueia adoção quando já existe adoção ativa para o animal', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(fakeAnimal());
      tutoresRepository.buscarPorId.mockResolvedValue(fakeTutor());
      adocoesRepository.buscarAtivaPorAnimalId.mockResolvedValue(fakeAdocao());

      await expect(service.registrar(dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
      expect(adocoesRepository.registrar).not.toHaveBeenCalled();
    });

    it('bloqueia se a transação não conseguir registrar a adoção', async () => {
      animaisRepository.buscarPorId.mockResolvedValue(fakeAnimal());
      tutoresRepository.buscarPorId.mockResolvedValue(fakeTutor());
      adocoesRepository.buscarAtivaPorAnimalId.mockResolvedValue(null);
      adocoesRepository.registrar.mockResolvedValue(null);

      await expect(service.registrar(dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listar', () => {
    it('retorna histórico paginado com filtros combinados', async () => {
      const filtros = Object.assign(new FiltrarAdocoesDto(), {
        page: 1,
        limit: 10,
        tutorId: 'tutor-1',
        animalId: 'animal-1',
        de: new Date('2026-06-01T00:00:00.000Z'),
        ate: new Date('2026-06-30T23:59:59.999Z'),
      });
      adocoesRepository.listar.mockResolvedValue({
        data: [fakeAdocao()],
        total: 1,
      });

      const result = await service.listar(filtros);

      expect(adocoesRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        tutorId: 'tutor-1',
        animalId: 'animal-1',
        de: filtros.de,
        ate: filtros.ate,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('bloqueia período inválido', async () => {
      const filtros = Object.assign(new FiltrarAdocoesDto(), {
        page: 1,
        limit: 10,
        de: new Date('2026-06-30T00:00:00.000Z'),
        ate: new Date('2026-06-01T00:00:00.000Z'),
      });

      await expect(service.listar(filtros)).rejects.toThrow(
        BadRequestException,
      );
      expect(adocoesRepository.listar).not.toHaveBeenCalled();
    });
  });

  describe('devolver', () => {
    const dto = { observacoes: 'Tutor mudou de cidade.' };

    it('registra devolução se a adoção ativa está consistente com o animal', async () => {
      adocoesRepository.buscarPorId.mockResolvedValue(fakeAdocao());
      animaisRepository.buscarPorId.mockResolvedValue(
        fakeAnimal({ status: StatusAnimal.ADOTADO, tutorId: 'tutor-1' }),
      );
      adocoesRepository.devolver.mockResolvedValue(
        fakeAdocao({
          devolvidoEm: new Date('2026-06-25T10:00:00.000Z'),
          devolvidoPorId: 'usuario-1',
          observacoesDevolucao: 'Tutor mudou de cidade.',
        }),
      );

      const result = await service.devolver('adocao-1', dto, usuario);

      expect(adocoesRepository.devolver).toHaveBeenCalledWith({
        id: 'adocao-1',
        animalId: 'animal-1',
        tutorId: 'tutor-1',
        devolvidoPorId: 'usuario-1',
        observacoesDevolucao: 'Tutor mudou de cidade.',
      });
      expect(result.devolvidoPorId).toBe('usuario-1');
      expect(result.observacoesDevolucao).toBe('Tutor mudou de cidade.');
    });

    it('lança NotFoundException se a adoção não existe', async () => {
      adocoesRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.devolver('adocao-1', dto, usuario)).rejects.toThrow(
        NotFoundException,
      );
      expect(adocoesRepository.devolver).not.toHaveBeenCalled();
    });

    it('bloqueia devolução de adoção já fechada', async () => {
      adocoesRepository.buscarPorId.mockResolvedValue(
        fakeAdocao({ devolvidoEm: new Date('2026-06-25T10:00:00.000Z') }),
      );

      await expect(service.devolver('adocao-1', dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
      expect(animaisRepository.buscarPorId).not.toHaveBeenCalled();
    });

    it('bloqueia devolução quando o vínculo atual do animal está inconsistente', async () => {
      adocoesRepository.buscarPorId.mockResolvedValue(fakeAdocao());
      animaisRepository.buscarPorId.mockResolvedValue(
        fakeAnimal({ status: StatusAnimal.ACOLHIMENTO, tutorId: null }),
      );

      await expect(service.devolver('adocao-1', dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
      expect(adocoesRepository.devolver).not.toHaveBeenCalled();
    });

    it('bloqueia se a transação não conseguir fechar a devolução', async () => {
      adocoesRepository.buscarPorId.mockResolvedValue(fakeAdocao());
      animaisRepository.buscarPorId.mockResolvedValue(
        fakeAnimal({ status: StatusAnimal.ADOTADO, tutorId: 'tutor-1' }),
      );
      adocoesRepository.devolver.mockResolvedValue(null);

      await expect(service.devolver('adocao-1', dto, usuario)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
