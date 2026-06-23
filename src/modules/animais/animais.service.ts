import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IAnimaisRepository } from './repositories/animais.repository.interface';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { AnimalResponseDto } from './dto/animal-response.dto';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import type { IUsuariosRepository } from '#src/modules/usuarios/repositories/usuarios.repository.interface';
import { USUARIOS_REPOSITORY } from '#src/modules/usuarios/repositories/usuarios.repository.interface';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AnimaisService {
  constructor(
    @Inject(ANIMAIS_REPOSITORY)
    private readonly animaisRepository: IAnimaisRepository,
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async criar(
    dto: CriarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    // Validar se há exatamente uma foto principal
    const fotos = dto.fotos || [];
    if (fotos.length === 0) {
      throw new BadRequestException(
        'O animal deve ter pelo menos uma foto inicial.',
      );
    }
    const principais = fotos.filter((f) => f.principal);
    if (principais.length !== 1) {
      throw new BadRequestException(
        'O animal deve ter exatamente uma foto principal.',
      );
    }

    const animal = await this.animaisRepository.criar(dto, usuario.sub);
    return AnimalResponseDto.fromEntity(animal);
  }

  async buscarPorId(id: string): Promise<AnimalResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    return AnimalResponseDto.fromEntity(animal);
  }

  async listar(
    filtros: FiltrarAnimaisDto,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    const { data, total } = await this.animaisRepository.listar({
      skip: filtros.skip,
      take: filtros.take,
      especie: filtros.especie,
      status: filtros.status,
      busca: filtros.busca,
    });

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      filtros,
    );
  }

  async atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const animalAtualizado = await this.animaisRepository.atualizar(
      id,
      dto,
      usuario.sub,
    );
    return AnimalResponseDto.fromEntity(animalAtualizado);
  }

  async excluir(
    id: string,
    senhaAdmin: string,
    usuario: JwtPayload,
  ): Promise<void> {
    if (usuario.perfil !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode excluir animais.');
    }

    const admin = await this.usuariosRepository.buscarPorId(usuario.sub);
    if (!admin || !(await bcrypt.compare(senhaAdmin, admin.senhaHash))) {
      throw new UnauthorizedException('Senha do administrador inválida.');
    }

    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    await this.animaisRepository.excluir(id, usuario.sub);
  }

  async adicionarFoto(
    animalId: string,
    url: string,
    principal: boolean,
    usuario: JwtPayload,
  ) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.adicionarFoto(
      animalId,
      url,
      principal,
      usuario.sub,
    );
    return foto;
  }

  async removerFoto(animalId: string, fotoId: string, usuario: JwtPayload) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.buscarFotoPorId(fotoId);
    if (!foto || !foto.ativo || foto.animalId !== animalId) {
      throw new NotFoundException('Foto não encontrada no animal informado');
    }

    const fotosAtivas = animal.fotos || [];
    if (fotosAtivas.length <= 1) {
      throw new BadRequestException(
        'O animal deve ter pelo menos uma foto ativa.',
      );
    }

    await this.animaisRepository.removerFoto(fotoId, usuario.sub);

    if (foto.principal) {
      const proximaFoto = fotosAtivas.find((f) => f.id !== fotoId);
      if (proximaFoto) {
        await this.animaisRepository.definirFotoPrincipal(
          animalId,
          proximaFoto.id,
          usuario.sub,
        );
      }
    }

    return { ok: true };
  }

  async definirFotoPrincipal(
    animalId: string,
    fotoId: string,
    usuario: JwtPayload,
  ) {
    const animal = await this.animaisRepository.buscarPorId(animalId);
    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const foto = await this.animaisRepository.buscarFotoPorId(fotoId);
    if (!foto || !foto.ativo || foto.animalId !== animalId) {
      throw new NotFoundException('Foto não encontrada no animal informado');
    }

    await this.animaisRepository.definirFotoPrincipal(
      animalId,
      fotoId,
      usuario.sub,
    );
    return { ok: true };
  }
}
