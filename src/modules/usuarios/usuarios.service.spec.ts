import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Perfil, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import {
  type IUsuariosRepository,
  USUARIOS_REPOSITORY,
} from './repositories/usuarios.repository.interface';
import { UsuariosService } from './usuarios.service';

jest.mock('bcrypt');

const fakeUsuario = (over: Partial<Usuario> = {}): Usuario => ({
  id: 'usuario-1',
  codigo: 1,
  nome: 'Paula Freitas',
  email: 'paula@sosbichosolto.com',
  senhaHash: 'hash-armazenado',
  perfil: Perfil.PROTETOR,
  ativo: true,
  criadoEm: new Date('2026-01-01'),
  criadoPorId: null,
  modificadoEm: new Date('2026-01-01'),
  modificadoPorId: null,
  ...over,
});

const admin: JwtPayload = {
  sub: 'admin-1',
  email: 'admin@sosbichosolto.com',
  perfil: Perfil.ADMIN,
};

describe('UsuariosService', () => {
  let service: UsuariosService;
  let repository: jest.Mocked<IUsuariosRepository>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<IUsuariosRepository> = {
      criar: jest.fn(),
      listar: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: USUARIOS_REPOSITORY, useValue: repoMock },
      ],
    }).compile();

    service = module.get(UsuariosService);
    repository = module.get(USUARIOS_REPOSITORY);
  });

  const dtoCriar: CriarUsuarioDto = {
    nome: 'Paula Freitas',
    email: 'paula@sosbichosolto.com',
    senha: 'Protetor@123',
    perfil: Perfil.PROTETOR,
  };

  describe('criar', () => {
    it('persiste a senha hasheada (nunca em texto puro) e retorna o usuário sem senhaHash', async () => {
      repository.buscarPorEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash-novo');
      repository.criar.mockResolvedValue(fakeUsuario());

      const resultado = await service.criar(dtoCriar, admin.sub);

      expect(bcrypt.hash).toHaveBeenCalledWith('Protetor@123', 10);
      const dadosPersistidos = repository.criar.mock.calls[0][0];
      expect(dadosPersistidos.senhaHash).toBe('hash-novo');
      expect(dadosPersistidos).not.toHaveProperty('senha');
      expect(dadosPersistidos.criadoPorId).toBe('admin-1');
      expect(resultado).not.toHaveProperty('senhaHash');
    });

    it('bloqueia e-mail duplicado com ConflictException', async () => {
      repository.buscarPorEmail.mockResolvedValue(fakeUsuario());

      await expect(service.criar(dtoCriar, admin.sub)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.criar).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('retorna o envelope paginado com meta correta e sem senhaHash', async () => {
      repository.listar.mockResolvedValue([
        [fakeUsuario(), fakeUsuario({ id: 'usuario-2' })],
        2,
      ]);

      const filtros = Object.assign(new FiltrarUsuariosDto(), {
        page: 1,
        limit: 10,
      });
      const resultado = await service.listar(filtros);

      // a filtragem de ativos vive no repositório (mockado aqui); o service delega a ele.
      expect(repository.listar).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(resultado.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(resultado.data).toHaveLength(2);
      expect(resultado.data[0]).not.toHaveProperty('senhaHash');
    });
  });

  describe('buscarUm', () => {
    it('lança NotFoundException quando o usuário não existe', async () => {
      repository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarUm('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFoundException quando o usuário está inativo', async () => {
      repository.buscarPorId.mockResolvedValue(fakeUsuario({ ativo: false }));

      await expect(service.buscarUm('usuario-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('atualizar', () => {
    it('lança NotFoundException ao atualizar usuário inexistente', async () => {
      repository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.atualizar('inexistente', { nome: 'Novo' }, admin.sub),
      ).rejects.toThrow(NotFoundException);
      expect(repository.atualizar).not.toHaveBeenCalled();
    });

    it('re-hasheia a senha ao trocá-la e registra o autor da alteração', async () => {
      repository.buscarPorId.mockResolvedValue(fakeUsuario());
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash-novo');
      repository.atualizar.mockResolvedValue(
        fakeUsuario({ nome: 'Paula Atualizada' }),
      );

      await service.atualizar(
        'usuario-1',
        { nome: 'Paula Atualizada', senha: 'Nova@1234' },
        admin.sub,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Nova@1234', 10);
      expect(repository.atualizar).toHaveBeenCalledWith(
        'usuario-1',
        expect.objectContaining({
          nome: 'Paula Atualizada',
          senhaHash: 'hash-novo',
          modificadoPorId: 'admin-1',
        }),
      );
    });

    it('verifica unicidade ao trocar o e-mail e bloqueia duplicado com ConflictException', async () => {
      repository.buscarPorId.mockResolvedValue(
        fakeUsuario({ email: 'antigo@x.com' }),
      );
      repository.buscarPorEmail.mockResolvedValue(
        fakeUsuario({ id: 'outro', email: 'novo@x.com' }),
      );

      await expect(
        service.atualizar('usuario-1', { email: 'novo@x.com' }, admin.sub),
      ).rejects.toThrow(ConflictException);
      expect(repository.atualizar).not.toHaveBeenCalled();
    });
  });

  describe('excluir', () => {
    it('faz a exclusão lógica (ativo = false) após revalidar a senha do admin', async () => {
      repository.buscarPorId.mockImplementation((id) =>
        Promise.resolve(
          id === admin.sub ? fakeUsuario({ id: admin.sub }) : fakeUsuario(),
        ),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      repository.atualizar.mockResolvedValue(fakeUsuario({ ativo: false }));

      const resultado = await service.excluir('usuario-1', 'Admin@123', admin);

      expect(resultado).toEqual({ ok: true });
      expect(repository.atualizar).toHaveBeenCalledWith('usuario-1', {
        ativo: false,
        modificadoPorId: 'admin-1',
      });
    });

    it('bloqueia auto-exclusão do admin (RN17) com ForbiddenException', async () => {
      repository.buscarPorId.mockResolvedValue(fakeUsuario({ id: admin.sub }));

      await expect(
        service.excluir(admin.sub, 'Admin@123', admin),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.atualizar).not.toHaveBeenCalled();
    });

    it('rejeita senha de admin inválida (RN03) com UnauthorizedException', async () => {
      repository.buscarPorId.mockImplementation((id) =>
        Promise.resolve(
          id === admin.sub ? fakeUsuario({ id: admin.sub }) : fakeUsuario(),
        ),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.excluir('usuario-1', 'senha-errada', admin),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.atualizar).not.toHaveBeenCalled();
    });

    it('lança NotFoundException ao excluir usuário inexistente', async () => {
      repository.buscarPorId.mockResolvedValue(null);

      await expect(
        service.excluir('inexistente', 'Admin@123', admin),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
