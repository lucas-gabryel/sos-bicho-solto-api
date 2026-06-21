import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Perfil, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import {
  type IUsuariosRepository,
  USUARIOS_REPOSITORY,
} from './repositories/usuarios.repository.interface';

const BCRYPT_SALT_ROUNDS = 10;

export interface UsuarioView {
  id: string;
  codigo: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: Date;
  modificadoEm: Date;
}

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async criar(dto: CriarUsuarioDto, autorId: string): Promise<UsuarioView> {
    await this.garantirEmailDisponivel(dto.email);

    const usuario = await this.usuariosRepository.criar({
      nome: dto.nome,
      email: dto.email,
      senhaHash: await bcrypt.hash(dto.senha, BCRYPT_SALT_ROUNDS),
      perfil: dto.perfil,
      criadoPorId: autorId,
      modificadoPorId: autorId,
    });

    return this.toView(usuario);
  }

  async listar(
    filtros: FiltrarUsuariosDto,
  ): Promise<RespostaPaginada<UsuarioView>> {
    const [usuarios, total] = await this.usuariosRepository.listar({
      skip: filtros.skip,
      take: filtros.take,
      perfil: filtros.perfil,
      busca: filtros.busca,
    });

    return paginar(
      usuarios.map((usuario) => this.toView(usuario)),
      total,
      filtros,
    );
  }

  async buscarUm(id: string): Promise<UsuarioView> {
    return this.toView(await this.buscarAtivoOuFalhar(id));
  }

  async atualizar(
    id: string,
    dto: AtualizarUsuarioDto,
    autorId: string,
  ): Promise<UsuarioView> {
    const usuario = await this.buscarAtivoOuFalhar(id);

    if (dto.email && dto.email !== usuario.email) {
      await this.garantirEmailDisponivel(dto.email);
    }

    const atualizado = await this.usuariosRepository.atualizar(id, {
      nome: dto.nome,
      email: dto.email,
      perfil: dto.perfil,
      senhaHash: dto.senha
        ? await bcrypt.hash(dto.senha, BCRYPT_SALT_ROUNDS)
        : undefined,
      modificadoPorId: autorId,
    });

    return this.toView(atualizado);
  }

  async excluir(
    id: string,
    senhaAdmin: string,
    admin: JwtPayload,
  ): Promise<{ ok: true }> {
    await this.buscarAtivoOuFalhar(id);

    if (id === admin.sub) {
      throw new ForbiddenException('Você não pode excluir o próprio usuário.');
    }

    await this.revalidarSenhaAdmin(admin.sub, senhaAdmin);

    await this.usuariosRepository.atualizar(id, {
      ativo: false,
      modificadoPorId: admin.sub,
    });

    return { ok: true };
  }

  private async buscarAtivoOuFalhar(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.buscarPorId(id);

    if (!usuario || !usuario.ativo) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  private async garantirEmailDisponivel(email: string): Promise<void> {
    const existente = await this.usuariosRepository.buscarPorEmail(email);

    if (existente) {
      throw new ConflictException('E-mail já cadastrado.');
    }
  }

  private async revalidarSenhaAdmin(
    adminId: string,
    senhaAdmin: string,
  ): Promise<void> {
    const admin = await this.usuariosRepository.buscarPorId(adminId);

    if (!admin || !(await bcrypt.compare(senhaAdmin, admin.senhaHash))) {
      throw new UnauthorizedException('Senha do administrador inválida.');
    }
  }

  private toView(usuario: Usuario): UsuarioView {
    return {
      id: usuario.id,
      codigo: usuario.codigo,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      criadoEm: usuario.criadoEm,
      modificadoEm: usuario.modificadoEm,
    };
  }
}
