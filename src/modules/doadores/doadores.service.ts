import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Doador } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IUsuariosRepository } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import type { IDoadoresRepository } from './repositories/doadores.repository.interface';
import { DOADORES_REPOSITORY } from './repositories/doadores.repository.interface';
import { CriarDoadorDto } from './dto/criar-doador.dto';
import { AtualizarDoadorDto } from './dto/atualizar-doador.dto';
import { FiltrarDoadoresDto } from './dto/filtrar-doadores.dto';
import { DoadorResponseDto } from './dto/doador-response.dto';
import {
  normalizarCpfCnpj,
  validarCpfCnpj,
} from './validators/cpf-cnpj.validator';

@Injectable()
export class DoadoresService {
  constructor(
    @Inject(DOADORES_REPOSITORY)
    private readonly doadoresRepository: IDoadoresRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async criar(
    dto: CriarDoadorDto,
    usuario: JwtPayload,
  ): Promise<DoadorResponseDto> {
    if (!validarCpfCnpj(dto.cpfCnpj)) {
      throw new BadRequestException('CPF ou CNPJ inválido.');
    }

    const cpfCnpjNormalizado = normalizarCpfCnpj(dto.cpfCnpj);
    await this.garantirCpfCnpjDisponivel(cpfCnpjNormalizado);

    const doador = await this.doadoresRepository.criar({
      nomeRazaoSocial: dto.nomeRazaoSocial,
      cpfCnpj: cpfCnpjNormalizado,
      email: dto.email,
      telefone: dto.telefone,
      endereco: dto.endereco,
      criadoPorId: usuario.sub,
      modificadoPorId: usuario.sub,
    });

    return DoadorResponseDto.fromEntity(doador);
  }

  async buscarUm(id: string): Promise<DoadorResponseDto> {
    const doador = await this.buscarAtivoOuFalhar(id);
    return DoadorResponseDto.fromEntity(doador);
  }

  async listar(
    filtros: FiltrarDoadoresDto,
  ): Promise<RespostaPaginada<DoadorResponseDto>> {
    const { data, total } = await this.doadoresRepository.listar({
      skip: filtros.skip,
      take: filtros.take,
      busca: filtros.busca,
    });

    return paginar(
      data.map((doador) => DoadorResponseDto.fromEntity(doador)),
      total,
      filtros,
    );
  }

  async atualizar(
    id: string,
    dto: AtualizarDoadorDto,
    usuario: JwtPayload,
  ): Promise<DoadorResponseDto> {
    const doador = await this.buscarAtivoOuFalhar(id);

    let cpfCnpjNormalizado: string | undefined = undefined;
    if (dto.cpfCnpj !== undefined) {
      if (!validarCpfCnpj(dto.cpfCnpj)) {
        throw new BadRequestException('CPF ou CNPJ inválido.');
      }

      cpfCnpjNormalizado = normalizarCpfCnpj(dto.cpfCnpj);
      if (cpfCnpjNormalizado !== normalizarCpfCnpj(doador.cpfCnpj)) {
        await this.garantirCpfCnpjDisponivel(cpfCnpjNormalizado);
      }
    }

    const atualizado = await this.doadoresRepository.atualizar(id, {
      nomeRazaoSocial: dto.nomeRazaoSocial,
      cpfCnpj: cpfCnpjNormalizado,
      email: dto.email,
      telefone: dto.telefone,
      endereco: dto.endereco,
      modificadoPorId: usuario.sub,
    });

    return DoadorResponseDto.fromEntity(atualizado);
  }

  async excluir(
    id: string,
    senhaAdmin: string,
    usuario: JwtPayload,
  ): Promise<{ ok: true }> {
    await this.buscarAtivoOuFalhar(id);

    const admin = await this.usuariosRepository.buscarPorId(usuario.sub);
    if (!admin || !(await bcrypt.compare(senhaAdmin, admin.senhaHash))) {
      throw new UnauthorizedException('Senha do administrador inválida.');
    }

    await this.doadoresRepository.excluir(id, usuario.sub);

    return { ok: true };
  }

  private async buscarAtivoOuFalhar(id: string): Promise<Doador> {
    const doador = await this.doadoresRepository.buscarPorId(id);
    if (!doador || !doador.ativo) {
      throw new NotFoundException('Doador não encontrado.');
    }
    return doador;
  }

  private async garantirCpfCnpjDisponivel(cpfCnpj: string): Promise<void> {
    const cleanCpfCnpj = normalizarCpfCnpj(cpfCnpj);
    const existente =
      await this.doadoresRepository.buscarPorCpfCnpj(cleanCpfCnpj);
    if (existente && existente.ativo !== false) {
      throw new ConflictException('CPF/CNPJ já cadastrado para outro doador.');
    }
  }
}
