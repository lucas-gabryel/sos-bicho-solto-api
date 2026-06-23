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

    it('deve marcar a primeira foto como principal caso nenhuma seja explicitamente principal', async () => {
      const dto = {
        nome: 'Rex',
        especie: EspecieAnimal.CAO,
        raca: 'SRD',
        sexo: SexoAnimal.MACHO,
        cor: 'Caramelo',
        pesoInicial: 10.5,
        localResgate: 'Rua A',
        fotos: [
          { url: 'https://exemplo.com/f1.jpg' },
          { url: 'https://exemplo.com/f2.jpg', principal: false },
        ],
      };

      mockRepository.criar.mockResolvedValue(mockAnimal);

      await service.criar(dto, usuarioAdmin);

      expect(dto.fotos[0].principal).toBe(true);
      expect(mockRepository.criar).toHaveBeenCalledWith(dto, usuarioAdmin.sub);
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

  describe('adicionarFoto', () => {
    it('deve adicionar uma foto ao animal com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      const fotoCriada = {
        id: 'foto-2',
        url: 'https://exemplo.com/outra.jpg',
        principal: false,
        ativo: true,
      };
      mockRepository.adicionarFoto.mockResolvedValue(fotoCriada);

      const result = await service.adicionarFoto(
        '123',
        'https://exemplo.com/outra.jpg',
        false,
        usuarioAdmin,
      );

      expect(mockRepository.buscarPorId).toHaveBeenCalledWith('123');
      expect(mockRepository.adicionarFoto).toHaveBeenCalledWith(
        '123',
        'https://exemplo.com/outra.jpg',
        false,
        usuarioAdmin.sub,
      );
      expect(result.id).toBe('foto-2');
      expect(result.url).toBe('https://exemplo.com/outra.jpg');
      expect(result.principal).toBe(false);
    });

    it('deve lançar NotFoundException se o animal não for encontrado ou não estiver ativo', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.adicionarFoto(
          '999',
          'https://exemplo.com/outra.jpg',
          false,
          usuarioAdmin,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removerFoto', () => {
    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.removerFoto('999', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se a foto não pertencer ao animal ou não estiver ativa', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue(null);

      await expect(
        service.removerFoto('123', 'foto-inexistente', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se for a única foto ativa do animal', async () => {
      const animalComUmaFoto = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/rex.jpg',
            principal: true,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComUmaFoto);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComUmaFoto.fotos[0],
      );

      await expect(
        service.removerFoto('123', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve remover a foto e reatribuir a principal para a próxima se a removida for a principal', async () => {
      const animalComDuasFotos = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/f1.jpg',
            principal: true,
            ativo: true,
          },
          {
            id: 'foto-2',
            animalId: '123',
            url: 'https://exemplo.com/f2.jpg',
            principal: false,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComDuasFotos);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComDuasFotos.fotos[0],
      );

      const result = await service.removerFoto('123', 'foto-1', usuarioAdmin);

      expect(mockRepository.removerFoto).toHaveBeenCalledWith(
        'foto-1',
        usuarioAdmin.sub,
      );
      expect(mockRepository.definirFotoPrincipal).toHaveBeenCalledWith(
        '123',
        'foto-2',
        usuarioAdmin.sub,
      );
      expect(result).toEqual({ ok: true });
    });

    it('deve apenas remover a foto se a removida não for a principal', async () => {
      const animalComDuasFotos = {
        ...mockAnimal,
        fotos: [
          {
            id: 'foto-1',
            animalId: '123',
            url: 'https://exemplo.com/f1.jpg',
            principal: true,
            ativo: true,
          },
          {
            id: 'foto-2',
            animalId: '123',
            url: 'https://exemplo.com/f2.jpg',
            principal: false,
            ativo: true,
          },
        ],
      };
      mockRepository.buscarPorId.mockResolvedValue(animalComDuasFotos);
      mockRepository.buscarFotoPorId.mockResolvedValue(
        animalComDuasFotos.fotos[1],
      );

      const result = await service.removerFoto('123', 'foto-2', usuarioAdmin);

      expect(mockRepository.removerFoto).toHaveBeenCalledWith(
        'foto-2',
        usuarioAdmin.sub,
      );
      expect(mockRepository.definirFotoPrincipal).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: true });
    });
  });

  describe('definirFotoPrincipal', () => {
    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockRepository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.definirFotoPrincipal('999', 'foto-1', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se a foto não for encontrada ou não pertencer ao animal', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue(null);

      await expect(
        service.definirFotoPrincipal('123', 'foto-inexistente', usuarioAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve definir a foto principal com sucesso', async () => {
      mockRepository.buscarPorId.mockResolvedValue(mockAnimal);
      mockRepository.buscarFotoPorId.mockResolvedValue({
        id: 'foto-1',
        animalId: '123',
        url: 'https://exemplo.com/rex.jpg',
        principal: false,
        ativo: true,
      });

      const result = await service.definirFotoPrincipal(
        '123',
        'foto-1',
        usuarioAdmin,
      );

      expect(mockRepository.definirFotoPrincipal).toHaveBeenCalledWith(
        '123',
        'foto-1',
        usuarioAdmin.sub,
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
