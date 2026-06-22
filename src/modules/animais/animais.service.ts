import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IAnimaisRepository } from './repositories/animais.repository.interface';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginar,
  RespostaPaginada,
  PaginacaoDto,
} from '#src/common/dto/paginacao.dto';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { AnimalResponseDto } from './dto/animal-response.dto';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';

@Injectable()
export class AnimaisService {
  constructor(
    @Inject(ANIMAIS_REPOSITORY)
    private readonly animaisRepository: IAnimaisRepository,
  ) {}

  async criar(
    dto: CriarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    if (usuario.perfil !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode criar animais');
    }

    const animal = await this.animaisRepository.criar(dto);
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
    skip: number = 0,
    take: number = 10,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    const { data, total } = await this.animaisRepository.listar(skip, take);

    const paginacaoDto = new PaginacaoDto();
    paginacaoDto.page = Math.floor(skip / take) + 1;
    paginacaoDto.limit = take;

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      paginacaoDto,
    );
  }

  async atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    usuario: JwtPayload,
  ): Promise<AnimalResponseDto> {
    if (usuario.perfil !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode atualizar animais');
    }

    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    const animalAtualizado = await this.animaisRepository.atualizar(id, dto);
    return AnimalResponseDto.fromEntity(animalAtualizado);
  }

  async excluir(id: string, usuario: JwtPayload): Promise<void> {
    if (usuario.perfil !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode excluir animais');
    }

    const animal = await this.animaisRepository.buscarPorId(id);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado');
    }

    await this.animaisRepository.excluir(id);
  }

  async listarPorEspecie(
    especie: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    const { data, total } = await this.animaisRepository.buscarPorEspecie(
      especie,
      skip,
      take,
    );

    const paginacaoDto = new PaginacaoDto();
    paginacaoDto.page = Math.floor(skip / take) + 1;
    paginacaoDto.limit = take;

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      paginacaoDto,
    );
  }

  async listarPorStatus(
    status: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<RespostaPaginada<AnimalResponseDto>> {
    const { data, total } = await this.animaisRepository.buscarPorStatus(
      status,
      skip,
      take,
    );

    const paginacaoDto = new PaginacaoDto();
    paginacaoDto.page = Math.floor(skip / take) + 1;
    paginacaoDto.limit = take;

    return paginar(
      data.map((animal) => AnimalResponseDto.fromEntity(animal)),
      total,
      paginacaoDto,
    );
  }
}
