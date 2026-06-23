import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { EspecieAnimal, SexoAnimal } from '@prisma/client';
import { AnimaisService } from './animais.service';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AnimaisService', () => {
  let service: AnimaisService;

  const mockRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    adicionarFoto: jest.fn(),
    removerFoto: jest.fn(),
    definirFotoPrincipal: jest.fn(),
    buscarFotoPorId: jest.fn(),
  };

  const mockUsuariosRepository = {
    buscarPorId: jest.fn(),
  };

  const usuarioAdmin = {
    sub: 'admin-123',
    email: 'admin@test.com',
    perfil: 'ADMIN' as const,
  };

  const usuarioProtetor = {
    sub: 'protetor-456',
    email: 'protetor@test.com',
    perfil: 'PROTETOR' as const,
  };

  const mockAdminUser = {
    id: 'admin-123',
    nome: 'Admin',
    email: 'admin@test.com',
    senhaHash: 'hash-senha-admin',
    perfil: 'ADMIN',
    ativo: true,
  };

  const mockAnimal = {
    id: '123',
    numeroRegistro: '20.06.2026.1',
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
    criadoPorId: 'admin-123',
    modificadoPorId: 'admin-123',
    fotos: [
      {
        id: 'foto-1',
        url: 'https://exemplo.com/rex.jpg',
        principal: true,
        ativo: true,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimaisService,
        {
          provide: ANIMAIS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: USUARIOS_REPOSITORY,
          useValue: mockUsuariosRepository,
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
    it('deve criar um animal com sucesso se contiver exatamente uma foto principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [{ url: 'https://exemplo.com/rex.jpg', principal: true }],
      };

      mockRepository.criar.mockResolvedValue(mockAnimal);

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockRepository.criar).toHaveBeenCalledWith(dto, usuarioAdmin.sub);
      expect(result.nome).toBe('Rex');
    });

    it('deve lançar BadRequestException se criar animal sem fotos', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [],
      };

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se houver mais de uma foto principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [
          { url: 'https://exemplo.com/f1.jpg', principal: true },
          { url: 'https://exemplo.com/f2.jpg', principal: true },
        ],
      };

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
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
  });

  describe('listar', () => {
    it('deve listar animais paginados com sucesso', async () => {
      mockRepository.listar.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const filtros = new FiltrarAnimaisDto();
      filtros.page = 1;
      filtros.limit = 10;

      const result = await service.listar(filtros);

      expect(mockRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        especie: undefined,
        status: undefined,
        busca: undefined,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um animal com sucesso', async () => {
      const dto = { nome: 'Rex Atualizado' };

      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.atualizar.mockResolvedValue({
        ...mockAnimal,
        nome: 'Rex Atualizado',
      });

      const result = await service.atualizar('123', dto, usuarioAdmin);

      expect(mockRepository.atualizar).toHaveBeenCalledWith(
        '123',
        dto,
        usuarioAdmin.sub,
      );
      expect(result.nome).toBe('Rex Atualizado');
    });
  });

  describe('excluir', () => {
    it('deve excluir um animal logicamente com revalidação de senha do administrador', async () => {
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);

      await service.excluir('123', 'SenhaAdmin@123', usuarioAdmin);

      expect(mockRepository.excluir).toHaveBeenCalledWith(
        '123',
        usuarioAdmin.sub,
      );
    });

    it('deve lançar ForbiddenException se o usuário não for ADMIN', async () => {
      await expect(
        service.excluir('123', 'senha', usuarioProtetor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar UnauthorizedException se a senha do admin estiver incorreta', async () => {
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.excluir('123', 'senha-errada', usuarioAdmin),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
