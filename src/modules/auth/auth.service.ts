import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  type IUsuariosRepository,
  USUARIOS_REPOSITORY,
} from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuariosRepository.buscarPorEmail(dto.email);

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const senhaConfere = await bcrypt.compare(dto.senha, usuario.senhaHash);

    if (!senhaConfere) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: this.toView(usuario),
    };
  }

  async me(id: string) {
    const usuario = await this.usuariosRepository.buscarPorId(id);

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException();
    }

    return this.toView(usuario);
  }

  private toView(usuario: Usuario) {
    return {
      id: usuario.id,
      codigo: usuario.codigo,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }
}
