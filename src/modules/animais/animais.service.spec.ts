import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EspecieAnimal, SexoAnimal, StatusAnimal } from '@prisma/client';
import { AnimaisService } from './animais.service';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';

describe('AnimaisService', () => {
  let service: AnimaisService;
  const mockRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    buscarPorEspecie: jest.fn(),
    buscarPorStatus: jest.fn(),
  };

  const usuarioAdmin = {
    sub: '123',
    email: 'admin@test.com',
    perfil: 'ADMIN' as const,
  };

  const usuarioProtetor = {
    sub: '456',
    email: 'protetor@test.com',
    perfil: 'PROTETOR' as const,
  };

  const mockAnimal = {
    id: '123',
    numeroRegistro: 'ANIMAL-123',
    nome: 'Rex',
    especie: 'CAO',
    raca: 'SRD',
    sexo: 'MACHO',
    porte: 'MEDIO',
    cor: 'Caramelo',
    pesoInicial: 10.5,
    pesoAtual: null,
    dataNascimento: null,
    castrado: false,
    vacinado: false,
    localResgate: 'Rua A',
    observacoes: null,
    status: 'ACOLHIMENTO',
    tutorId: null,
    ativo: true,
    criadoEm: new Date(),
    modificadoEm: new Date(),
    criadoPorId: null,
    modificadoPorId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimaisService,
        {
          provide: ANIMAIS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnimaisService>(AnimaisService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar um animal com sucesso (ADMIN)', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
      };

      mockRepository.criar.mockResolvedValue(mockAnimal);

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockRepository.criar).toHaveBeenCalledWith(dto);
      expect(result.nome).toBe('Rex');
    });

    it('deve lançar ForbiddenException se não for ADMIN', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
      };

      await expect(service.criar(dto, usuarioProtetor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar um animal por ID com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      const result = await service.buscarPorId('123');

      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('123');
      expect(result.nome).toBe('Rex');
    });

    it('deve lançar NotFoundException se animal não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId('999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se animal estiver inativo', async () => {
      mockRepository.buscarPorId.mockResolvedValue({
        ...mockAnimal,
        ativo: false,
      });

      await expect(service.buscarPorId('123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listar', () => {
    it('deve listar animais com sucesso', async () => {
      mockRepository.listar.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const result = await service.listar(0, 10);

      expect(mockRepository.listar).toHaveBeenCalledWith(0, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('deve retornar lista vazia se nenhum animal existir', async () => {
      mockRepository.listar.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.listar(0, 10);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um animal com sucesso (ADMIN)', async () => {
      const dto = { nome: 'Rex Atualizado' };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue({
        ...mockAnimal,
        nome: 'Rex Atualizado',
      });

      const result = await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledWith('123', dto);
      expect(result.nome).toBe('Rex Atualizado');
    });

    it('deve lançar ForbiddenException se não for ADMIN', async () => {
      const dto = { nome: 'Rex Atualizado' };

      await expect(
        service.atualizar('123', dto, usuarioProtetor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se animal não existir', async () => {
      const dto = { nome: 'Rex Atualizado' };

      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.atualizar('999', dto, usuarioAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('excluir', () => {
    it('deve excluir um animal com sucesso (ADMIN)', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.excluir.mockResolvedValue({
        ...mockAnimal,
        ativo: false,
      });

      await service.excluir('123', usuarioAdmin);

      expect(mockRepository.excluir).toHaveBeenCalledWith('123');
    });

    it('deve lançar ForbiddenException se não for ADMIN', async () => {
      await expect(service.excluir('123', usuarioProtetor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar NotFoundException se animal não existir', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.excluir('999', usuarioAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listarPorEspecie', () => {
    it('deve listar animais por espécie com sucesso', async () => {
      mockRepository.buscarPorEspecie.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const result = await service.listarPorEspecie(EspecieAnimal.CAO, 0, 10);

      expect(mockRepository.buscarPorEspecie).toHaveBeenCalledWith(
        EspecieAnimal.CAO,
        0,
        10,
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('listarPorStatus', () => {
    it('deve listar animais por status com sucesso', async () => {
      mockRepository.buscarPorStatus.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const result = await service.listarPorStatus(
        StatusAnimal.ACOLHIMENTO,
        0,
        10,
      );

      expect(mockRepository.buscarPorStatus).toHaveBeenCalledWith(
        StatusAnimal.ACOLHIMENTO,
        0,
        10,
      );
      expect(result.data).toHaveLength(1);
    });
  });
});
