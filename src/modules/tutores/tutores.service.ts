import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  paginar,
  PaginacaoDto,
  RespostaPaginada,
} from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IUsuariosRepository } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import type {
  ITutoresRepository,
  TutorComContagem,
} from './repositories/tutores.repository.interface';
import { TUTORES_REPOSITORY } from './repositories/tutores.repository.interface';
import type { IAnimaisRepository } from '#src/modules/animais/repositories/animais.repository.interface';
import { ANIMAIS_REPOSITORY } from '#src/modules/animais/repositories/animais.repository.interface';

import { CriarTutorDto } from './dto/criar-tutor.dto';
import { AtualizarTutorDto } from './dto/atualizar-tutor.dto';
import { FiltrarTutoresDto } from './dto/filtrar-tutores.dto';
import { TutorResponseDto } from './dto/tutor-response.dto';
import { AnimalResponseDto } from '#src/modules/animais/dto/animal-response.dto';

@Injectable()
export class TutoresService {
  constructor(
    @Inject(TUTORES_REPOSITORY)
    private readonly tutoresRepository: ITutoresRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
    @Inject(ANIMAIS_REPOSITORY)
    private readonly animaisRepository: IAnimaisRepository,
  ) {}

  async criar(
    dto: CriarTutorDto,
    usuario: JwtPayload,
  ): Promise<TutorResponseDto> {
    const cpfNormalizado = dto.cpf.replace(/\D/g, '');
    await this.garantirEmailDisponivel(dto.email);
    await this.garantirCpfDisponivel(cpfNormalizado);

    const tutor = await this.tutoresRepository.criar({
      nome: dto.nome,
      cpf: cpfNormalizado,
      telefone: dto.telefone,
      email: dto.email,
      endereco: dto.endereco,
      dataNascimento: new Date(dto.dataNascimento),
      criadoPorId: usuario.sub,
      modificadoPorId: usuario.sub,
    });

    return TutorResponseDto.fromEntity(tutor);
  }

  async buscarUm(id: string): Promise<TutorResponseDto> {
    const tutor = await this.buscarAtivoOuFalhar(id);
    return TutorResponseDto.fromEntity(tutor);
  }

  async listar(
    filtros: FiltrarTutoresDto,
  ): Promise<RespostaPaginada<TutorResponseDto>> {
    const { data, total } = await this.tutoresRepository.listar({
      skip: filtros.skip,
      take: filtros.take,
      busca: filtros.busca,
    });

    return paginar(
      data.map((tutor) => TutorResponseDto.fromEntity(tutor)),
      total,
      filtros,
    );
  }

  async atualizar(
    id: string,
    dto: AtualizarTutorDto,
    usuario: JwtPayload,
  ): Promise<TutorResponseDto> {
    const tutor = await this.buscarAtivoOuFalhar(id);

    if (dto.email && dto.email !== tutor.email) {
      await this.garantirEmailDisponivel(dto.email);
    }

    let cpfNormalizado: string | undefined = undefined;
    if (dto.cpf) {
      cpfNormalizado = dto.cpf.replace(/\D/g, '');
      if (cpfNormalizado !== tutor.cpf.replace(/\D/g, '')) {
        await this.garantirCpfDisponivel(cpfNormalizado);
      }
    }

    const atualizado = await this.tutoresRepository.atualizar(id, {
      nome: dto.nome,
      cpf: cpfNormalizado,
      telefone: dto.telefone,
      email: dto.email,
      endereco: dto.endereco,
      dataNascimento: dto.dataNascimento
        ? new Date(dto.dataNascimento)
        : undefined,
      modificadoPorId: usuario.sub,
    });

    return TutorResponseDto.fromEntity(atualizado);
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

    await this.tutoresRepository.excluir(id, usuario.sub);

    return { ok: true };
  }

  async buscarAnimaisDoTutor(
    id: string,
    paginacao: PaginacaoDto,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    await this.buscarAtivoOuFalhar(id);
    const { data, total } = await this.animaisRepository.listar({
      skip: paginacao.skip,
      take: paginacao.take,
      tutorId: id,
    });

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      paginacao,
    );
  }

  private async buscarAtivoOuFalhar(id: string): Promise<TutorComContagem> {
    const tutor = await this.tutoresRepository.buscarPorId(id);
    if (!tutor || !tutor.ativo) {
      throw new NotFoundException('Tutor não encontrado.');
    }
    return tutor;
  }

  private async garantirEmailDisponivel(email: string): Promise<void> {
    const existente = await this.tutoresRepository.buscarPorEmail(email);
    if (existente && existente.ativo) {
      throw new ConflictException('E-mail já cadastrado para outro tutor.');
    }
  }

  private async garantirCpfDisponivel(cpf: string): Promise<void> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const existente = await this.tutoresRepository.buscarPorCpf(cleanCpf);
    if (existente && existente.ativo) {
      throw new ConflictException('CPF já cadastrado para outro tutor.');
    }
  }
}
