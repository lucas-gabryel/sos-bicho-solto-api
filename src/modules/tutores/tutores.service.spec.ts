import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TutoresService } from './tutores.service';
import { TUTORES_REPOSITORY } from './repositories/tutores.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { ANIMAIS_REPOSITORY } from '#src/modules/animais/repositories/animais.repository.interface';
import { FiltrarTutoresDto } from './dto/filtrar-tutores.dto';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('TutoresService', () => {
  let service: TutoresService;

  const mockTutoresRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCpf: jest.fn(),
    buscarPorEmail: jest.fn(),
    listar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
  };

  const mockUsuariosRepository = {
    buscarPorId: jest.fn(),
  };

  const mockAnimaisRepository = {
    listar: jest.fn(),
  };

  const usuarioAdmin = {
    sub: 'admin-123',
    email: 'admin@test.com',
    perfil: 'ADMIN' as const,
  };

  const mockAdminUser = {
    id: 'admin-123',
    nome: 'Admin',
    email: 'admin@test.com',
    senhaHash: 'hash-senha-admin',
    perfil: 'ADMIN',
    ativo: true,
  };

  const mockTutor = {
    id: 'tutor-123',
    codigo: 1,
    nome: 'Ana Clara Santos',
    cpf: '39053344705',
    telefone: '(82) 99912-3456',
    email: 'ana.clara@email.com',
    endereco: 'Rua Pedro Oliveira, 145',
    dataNascimento: new Date('1992-03-15'),
    ativo: true,
    criadoEm: new Date(),
    modificadoEm: new Date(),
    criadoPorId: 'admin-123',
    modificadoPorId: 'admin-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TutoresService,
        {
          provide: TUTORES_REPOSITORY,
          useValue: mockTutoresRepository,
        },
        {
          provide: USUARIOS_REPOSITORY,
          useValue: mockUsuariosRepository,
        },
        {
          provide: ANIMAIS_REPOSITORY,
          useValue: mockAnimaisRepository,
        },
      ],
    }).compile();

    service = module.get<TutoresService>(TutoresService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar um tutor com sucesso se CPF e email forem únicos', async () => {
      const dto = {
        nome: 'Ana Clara Santos',
        cpf: '390.533.447-05',
        telefone: '(82) 99912-3456',
        email: 'ana.clara@email.com',
        endereco: 'Rua Pedro Oliveira, 145',
        dataNascimento: new Date('1992-03-15'),
      };

      mockTutoresRepository.buscarPorEmail.mockResolvedValue(null);
      mockTutoresRepository.buscarPorCpf.mockResolvedValue(null);
      mockTutoresRepository.criar.mockResolvedValue(mockTutor);

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockTutoresRepository.criar).toHaveBeenCalledWith({
        ...dto,
        cpf: '39053344705',
        criadoPorId: usuarioAdmin.sub,
        modificadoPorId: usuarioAdmin.sub,
      });
      expect(result.nome).toBe('Ana Clara Santos');
    });

    it('deve lançar ConflictException se o email já estiver em uso', async () => {
      const dto = {
        nome: 'Ana Clara Santos',
        cpf: '390.533.447-05',
        telefone: '(82) 99912-3456',
        email: 'ana.clara@email.com',
        endereco: 'Rua Pedro Oliveira, 145',
        dataNascimento: new Date('1992-03-15'),
      };

      mockTutoresRepository.buscarPorEmail.mockResolvedValue(mockTutor);

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException se o CPF já estiver em uso', async () => {
      const dto = {
        nome: 'Ana Clara Santos',
        cpf: '390.533.447-05',
        telefone: '(82) 99912-3456',
        email: 'ana.clara@email.com',
        endereco: 'Rua Pedro Oliveira, 145',
        dataNascimento: new Date('1992-03-15'),
      };

      mockTutoresRepository.buscarPorEmail.mockResolvedValue(null);
      mockTutoresRepository.buscarPorCpf.mockResolvedValue(mockTutor);

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('buscarUm', () => {
    it('deve retornar detalhes do tutor por ID com sucesso', async () => {
      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);

      const result = await service.buscarUm('tutor-123');

      expect(mockTutoresRepository.buscarPorId).toHaveBeenCalledWith(
        'tutor-123',
      );
      expect(result.nome).toBe('Ana Clara Santos');
    });

    it('deve lançar NotFoundException se tutor não existir', async () => {
      mockTutoresRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarUm('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listar', () => {
    it('deve retornar listagem paginada de tutores', async () => {
      mockTutoresRepository.listar.mockResolvedValue({
        data: [mockTutor],
        total: 1,
      });

      const filtros = new FiltrarTutoresDto();
      filtros.page = 1;
      filtros.limit = 10;

      const result = await service.listar(filtros);

      expect(mockTutoresRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        busca: undefined,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um tutor com sucesso', async () => {
      const dto = { nome: 'Ana Santos' };

      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockTutoresRepository.atualizar.mockResolvedValue({
        ...mockTutor,
        nome: 'Ana Santos',
      });

      const result = await service.atualizar('tutor-123', dto, usuarioAdmin);

      expect(mockTutoresRepository.atualizar).toHaveBeenCalledWith(
        'tutor-123',
        { ...dto, modificadoPorId: usuarioAdmin.sub },
      );
      expect(result.nome).toBe('Ana Santos');
    });

    it('deve atualizar o CPF do tutor normalizando-o', async () => {
      const dto = { cpf: '390.533.447-05' };

      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockTutoresRepository.buscarPorCpf.mockResolvedValue(null);
      mockTutoresRepository.atualizar.mockResolvedValue({
        ...mockTutor,
        cpf: '39053344705',
      });

      const result = await service.atualizar('tutor-123', dto, usuarioAdmin);

      expect(mockTutoresRepository.atualizar).toHaveBeenCalledWith(
        'tutor-123',
        { cpf: '39053344705', modificadoPorId: usuarioAdmin.sub },
      );
      expect(result.cpf).toBe('39053344705');
    });

    it('não deve validar unicidade se o CPF enviado for igual ao existente porém em formato diferente', async () => {
      const dto = { cpf: '390.533.447-05' };

      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockTutoresRepository.atualizar.mockResolvedValue(mockTutor);

      await service.atualizar('tutor-123', dto, usuarioAdmin);

      expect(mockTutoresRepository.buscarPorCpf).not.toHaveBeenCalled();
      expect(mockTutoresRepository.atualizar).toHaveBeenCalledWith(
        'tutor-123',
        { cpf: '39053344705', modificadoPorId: usuarioAdmin.sub },
      );
    });

    it('deve validar unicidade se o CPF enviado for diferente do existente', async () => {
      const dto = { cpf: '111.111.111-11' };

      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockTutoresRepository.buscarPorCpf.mockResolvedValue(null);
      mockTutoresRepository.atualizar.mockResolvedValue({
        ...mockTutor,
        cpf: '11111111111',
      });

      await service.atualizar('tutor-123', dto, usuarioAdmin);

      expect(mockTutoresRepository.buscarPorCpf).toHaveBeenCalledWith(
        '11111111111',
      );
      expect(mockTutoresRepository.atualizar).toHaveBeenCalledWith(
        'tutor-123',
        { cpf: '11111111111', modificadoPorId: usuarioAdmin.sub },
      );
    });
  });

  describe('excluir', () => {
    it('deve excluir o tutor logicamente se a senha do admin estiver correta', async () => {
      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.excluir('tutor-123', 'SenhaAdmin@123', usuarioAdmin);

      expect(mockTutoresRepository.excluir).toHaveBeenCalledWith(
        'tutor-123',
        usuarioAdmin.sub,
      );
    });

    it('deve lançar UnauthorizedException se a senha do admin for incorreta', async () => {
      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.excluir('tutor-123', 'senha-errada', usuarioAdmin),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('buscarAnimaisDoTutor', () => {
    it('deve listar animais vinculados ao tutor', async () => {
      const mockAnimal = {
        id: 'animal-1',
        numeroRegistro: '20.06.2026.1',
        nome: 'Rex',
        especie: 'CAO',
        raca: 'SRD',
        sexo: 'MACHO',
        cor: 'Caramelo',
        pesoInicial: 10.5,
        status: 'ADOTADO',
        tutorId: 'tutor-123',
        ativo: true,
      };

      mockTutoresRepository.buscarPorId.mockResolvedValue(mockTutor);
      mockAnimaisRepository.listar.mockResolvedValue({
        data: [mockAnimal],
        total: 1,
      });

      const paginacao = Object.assign(new PaginacaoDto(), {
        page: 1,
        limit: 10,
      });
      const result = await service.buscarAnimaisDoTutor('tutor-123', paginacao);

      expect(mockAnimaisRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        tutorId: 'tutor-123',
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].nome).toBe('Rex');
      expect(result.meta.total).toBe(1);
    });
  });
});
