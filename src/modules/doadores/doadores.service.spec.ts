import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DoadoresService } from './doadores.service';
import { DOADORES_REPOSITORY } from './repositories/doadores.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { FiltrarDoadoresDto } from './dto/filtrar-doadores.dto';

jest.mock('bcrypt');

describe('DoadoresService', () => {
  let service: DoadoresService;

  const mockDoadoresRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCpfCnpj: jest.fn(),
    listar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
  };

  const mockUsuariosRepository = {
    buscarPorId: jest.fn(),
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

  const mockDoador = {
    id: 'doador-123',
    nomeRazaoSocial: 'Pet Shop Amigo Fiel LTDA',
    cpfCnpj: '11222333000181',
    email: 'contato@amigofiel.com.br',
    telefone: '(82) 99912-3456',
    endereco: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    criadoPorId: 'admin-123',
    modificadoPorId: 'admin-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoadoresService,
        {
          provide: DOADORES_REPOSITORY,
          useValue: mockDoadoresRepository,
        },
        {
          provide: USUARIOS_REPOSITORY,
          useValue: mockUsuariosRepository,
        },
      ],
    }).compile();

    service = module.get<DoadoresService>(DoadoresService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('criar', () => {
    it('deve criar um doador pessoa jurídica (CNPJ) com sucesso', async () => {
      const dto = {
        nomeRazaoSocial: 'Pet Shop Amigo Fiel LTDA',
        cpfCnpj: '11.222.333/0001-81',
        email: 'contato@amigofiel.com.br',
        telefone: '(82) 99912-3456',
        endereco: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
      };

      mockDoadoresRepository.buscarPorCpfCnpj.mockResolvedValue(null);
      mockDoadoresRepository.criar.mockResolvedValue(mockDoador);

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockDoadoresRepository.criar).toHaveBeenCalledWith({
        ...dto,
        cpfCnpj: '11222333000181',
        criadoPorId: usuarioAdmin.sub,
        modificadoPorId: usuarioAdmin.sub,
      });
      expect(result.nomeRazaoSocial).toBe('Pet Shop Amigo Fiel LTDA');
      expect(result.cpfCnpj).toBe('11222333000181');
    });

    it('deve criar um doador pessoa física (CPF) com sucesso', async () => {
      const dto = {
        nomeRazaoSocial: 'Ana Clara Santos',
        cpfCnpj: '390.533.447-05',
        email: 'ana@email.com',
        telefone: '(82) 99912-3456',
        endereco: 'Rua Pedro Oliveira, 145',
      };

      mockDoadoresRepository.buscarPorCpfCnpj.mockResolvedValue(null);
      mockDoadoresRepository.criar.mockResolvedValue({
        ...mockDoador,
        nomeRazaoSocial: 'Ana Clara Santos',
        cpfCnpj: '39053344705',
      });

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockDoadoresRepository.criar).toHaveBeenCalledWith({
        ...dto,
        cpfCnpj: '39053344705',
        criadoPorId: usuarioAdmin.sub,
        modificadoPorId: usuarioAdmin.sub,
      });
      expect(result.cpfCnpj).toBe('39053344705');
    });

    it('deve criar um doador utilizando o alias "nome" enviado pelo frontend', async () => {
      const dto = {
        nome: 'João Kinitos',
        cpfCnpj: '58.099.647/0001-00',
        email: 'kinitos@gmail.com',
        telefone: '(99) 99999-9999',
        endereco: 'Rua, 8, bairro, cidade',
      };

      mockDoadoresRepository.buscarPorCpfCnpj.mockResolvedValue(null);
      mockDoadoresRepository.criar.mockResolvedValue({
        ...mockDoador,
        nomeRazaoSocial: 'João Kinitos',
        cpfCnpj: '58099647000100',
      });

      const result = await service.criar(dto, usuarioAdmin);

      expect(mockDoadoresRepository.criar).toHaveBeenCalledWith({
        nomeRazaoSocial: 'João Kinitos',
        cpfCnpj: '58099647000100',
        email: 'kinitos@gmail.com',
        telefone: '(99) 99999-9999',
        endereco: 'Rua, 8, bairro, cidade',
        criadoPorId: usuarioAdmin.sub,
        modificadoPorId: usuarioAdmin.sub,
      });
      expect(result.nomeRazaoSocial).toBe('João Kinitos');
      expect(result.nome).toBe('João Kinitos');
    });

    it('deve lançar BadRequestException se nem nome nem nomeRazaoSocial forem informados', async () => {
      const dto = {
        cpfCnpj: '58.099.647/0001-00',
        email: 'kinitos@gmail.com',
        telefone: '(99) 99999-9999',
        endereco: 'Rua, 8, bairro, cidade',
      } as any;

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se o CPF ou CNPJ for inválido', async () => {
      const dto = {
        nomeRazaoSocial: 'Doador Inválido',
        cpfCnpj: '111.111.111-11',
        email: 'invalido@email.com',
        telefone: '(82) 99912-3456',
        endereco: 'Rua A, 10',
      };

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDoadoresRepository.criar).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se o CPF/CNPJ já estiver cadastrado', async () => {
      const dto = {
        nomeRazaoSocial: 'Pet Shop Amigo Fiel LTDA',
        cpfCnpj: '11.222.333/0001-81',
        email: 'contato@amigofiel.com.br',
        telefone: '(82) 99912-3456',
        endereco: 'Rua Pedro Oliveira, 145',
      };

      mockDoadoresRepository.buscarPorCpfCnpj.mockResolvedValue(mockDoador);

      await expect(service.criar(dto, usuarioAdmin)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDoadoresRepository.criar).not.toHaveBeenCalled();
    });
  });

  describe('buscarUm', () => {
    it('deve retornar detalhes do doador por ID com sucesso', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);

      const result = await service.buscarUm('doador-123');

      expect(mockDoadoresRepository.buscarPorId).toHaveBeenCalledWith(
        'doador-123',
      );
      expect(result.nomeRazaoSocial).toBe('Pet Shop Amigo Fiel LTDA');
    });

    it('deve lançar NotFoundException se doador não existir ou estiver inativo', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarUm('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listar', () => {
    it('deve retornar listagem paginada de doadores', async () => {
      mockDoadoresRepository.listar.mockResolvedValue({
        data: [mockDoador],
        total: 1,
      });

      const filtros = new FiltrarDoadoresDto();
      filtros.page = 1;
      filtros.limit = 10;
      filtros.busca = 'Amigo';

      const result = await service.listar(filtros);

      expect(mockDoadoresRepository.listar).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        busca: 'Amigo',
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('atualizar', () => {
    it('deve atualizar um doador com sucesso', async () => {
      const dto = { nomeRazaoSocial: 'Pet Shop Novo Nome LTDA' };

      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockDoadoresRepository.atualizar.mockResolvedValue({
        ...mockDoador,
        nomeRazaoSocial: 'Pet Shop Novo Nome LTDA',
      });

      const result = await service.atualizar('doador-123', dto, usuarioAdmin);

      expect(mockDoadoresRepository.atualizar).toHaveBeenCalledWith(
        'doador-123',
        expect.objectContaining({
          nomeRazaoSocial: 'Pet Shop Novo Nome LTDA',
          modificadoPorId: usuarioAdmin.sub,
        }),
      );
      expect(result.nomeRazaoSocial).toBe('Pet Shop Novo Nome LTDA');
    });

    it('não deve consultar unicidade se o CPF/CNPJ enviado for igual ao existente', async () => {
      const dto = { cpfCnpj: '11.222.333/0001-81' };

      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockDoadoresRepository.atualizar.mockResolvedValue(mockDoador);

      await service.atualizar('doador-123', dto, usuarioAdmin);

      expect(mockDoadoresRepository.buscarPorCpfCnpj).not.toHaveBeenCalled();
    });

    it('deve validar unicidade se o CPF/CNPJ enviado for diferente do existente', async () => {
      const dto = { cpfCnpj: '390.533.447-05' };

      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockDoadoresRepository.buscarPorCpfCnpj.mockResolvedValue(null);
      mockDoadoresRepository.atualizar.mockResolvedValue({
        ...mockDoador,
        cpfCnpj: '39053344705',
      });

      await service.atualizar('doador-123', dto, usuarioAdmin);

      expect(mockDoadoresRepository.buscarPorCpfCnpj).toHaveBeenCalledWith(
        '39053344705',
      );
    });

    it('deve lançar BadRequestException ao atualizar com CPF/CNPJ inválido', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);

      await expect(
        service.atualizar(
          'doador-123',
          { cpfCnpj: '00000000000' },
          usuarioAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('excluir', () => {
    it('deve excluir o doador logicamente se a senha do admin estiver correta', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.excluir(
        'doador-123',
        'SenhaAdmin@123',
        usuarioAdmin,
      );

      expect(mockDoadoresRepository.excluir).toHaveBeenCalledWith(
        'doador-123',
        usuarioAdmin.sub,
      );
      expect(result).toEqual({ ok: true });
    });

    it('deve lançar UnauthorizedException se a senha do admin for incorreta', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockUsuariosRepository.buscarPorId.mockResolvedValue(mockAdminUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.excluir('doador-123', 'senha-errada', usuarioAdmin),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
