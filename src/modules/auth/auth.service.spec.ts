import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Perfil, Usuario } from '@prisma/client';
import { compare } from 'bcrypt';
import {
  type IUsuariosRepository,
  USUARIOS_REPOSITORY,
} from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { AuthService } from './auth.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<IUsuariosRepository>;
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    const repoMock: jest.Mocked<IUsuariosRepository> = {
      criar: jest.fn(),
      listar: jest.fn(),
      buscarPorEmail: jest.fn(),
      buscarPorId: jest.fn(),
      atualizar: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('token-jwt') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USUARIOS_REPOSITORY, useValue: repoMock },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
    repository = module.get(USUARIOS_REPOSITORY);
  });

  describe('login', () => {
    it('retorna access_token e o usuário (sem senhaHash) com credenciais válidas', async () => {
      repository.buscarPorEmail.mockResolvedValue(fakeUsuario());
      (compare as jest.Mock).mockResolvedValue(true);

      const resultado = await service.login({
        email: 'paula@sosbichosolto.com',
        senha: 'Protetor@123',
      });

      expect(resultado.access_token).toBe('token-jwt');
      expect(resultado.usuario).not.toHaveProperty('senhaHash');
      expect(resultado.usuario.email).toBe('paula@sosbichosolto.com');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'usuario-1',
        email: 'paula@sosbichosolto.com',
        perfil: Perfil.PROTETOR,
      });
    });

    it('lança UnauthorizedException quando a senha está errada', async () => {
      repository.buscarPorEmail.mockResolvedValue(fakeUsuario());
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'paula@sosbichosolto.com', senha: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('bloqueia login de usuário inativo (não chega a comparar a senha)', async () => {
      repository.buscarPorEmail.mockResolvedValue(
        fakeUsuario({ ativo: false }),
      );

      await expect(
        service.login({
          email: 'paula@sosbichosolto.com',
          senha: 'Protetor@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(compare).not.toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando o e-mail não existe', async () => {
      repository.buscarPorEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@x.com', senha: 'Protetor@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('retorna o usuário ativo sem senhaHash', async () => {
      repository.buscarPorId.mockResolvedValue(fakeUsuario());

      const resultado = await service.me('usuario-1');

      expect(resultado).not.toHaveProperty('senhaHash');
      expect(resultado.id).toBe('usuario-1');
    });

    it('lança UnauthorizedException quando o usuário não existe', async () => {
      repository.buscarPorId.mockResolvedValue(null);

      await expect(service.me('inexistente')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
