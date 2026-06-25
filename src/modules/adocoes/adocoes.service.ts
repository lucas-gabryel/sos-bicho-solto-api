import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IAnimaisRepository } from '#src/modules/animais/repositories/animais.repository.interface';
import type { ITutoresRepository } from '#src/modules/tutores/repositories/tutores.repository.interface';
import type { IAdocoesRepository } from './repositories/adocoes.repository.interface';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusAnimal } from '@prisma/client';
import { ANIMAIS_REPOSITORY } from '#src/modules/animais/repositories/animais.repository.interface';
import { TUTORES_REPOSITORY } from '#src/modules/tutores/repositories/tutores.repository.interface';
import { AdocaoResponseDto } from './dto/adocao-response.dto';
import { RegistrarAdocaoDto } from './dto/registrar-adocao.dto';
import { RegistrarDevolucaoDto } from './dto/registrar-devolucao.dto';
import { ADOCOES_REPOSITORY } from './repositories/adocoes.repository.interface';

@Injectable()
export class AdocoesService {
  constructor(
    @Inject(ADOCOES_REPOSITORY)
    private readonly adocoesRepository: IAdocoesRepository,
    @Inject(ANIMAIS_REPOSITORY)
    private readonly animaisRepository: IAnimaisRepository,
    @Inject(TUTORES_REPOSITORY)
    private readonly tutoresRepository: ITutoresRepository,
  ) {}

  async registrar(
    dto: RegistrarAdocaoDto,
    usuario: JwtPayload,
  ): Promise<AdocaoResponseDto> {
    const animal = await this.animaisRepository.buscarPorId(dto.animalId);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado.');
    }

    if (animal.status !== StatusAnimal.ACOLHIMENTO || animal.tutorId) {
      throw new BadRequestException('Animal não está disponível para adoção.');
    }

    const tutor = await this.tutoresRepository.buscarPorId(dto.tutorId);

    if (!tutor || !tutor.ativo) {
      throw new NotFoundException('Tutor não encontrado.');
    }

    const adocaoAtiva = await this.adocoesRepository.buscarAtivaPorAnimalId(
      dto.animalId,
    );

    if (adocaoAtiva) {
      throw new BadRequestException('Animal já possui uma adoção ativa.');
    }

    const adocao = await this.adocoesRepository.registrar({
      animalId: dto.animalId,
      tutorId: dto.tutorId,
      protetorId: usuario.sub,
      observacoes: dto.observacoes,
    });

    if (!adocao) {
      throw new BadRequestException('Animal não está disponível para adoção.');
    }

    return AdocaoResponseDto.fromEntity(adocao);
  }

  async devolver(
    id: string,
    dto: RegistrarDevolucaoDto,
    usuario: JwtPayload,
  ): Promise<AdocaoResponseDto> {
    const adocao = await this.adocoesRepository.buscarPorId(id);

    if (!adocao) {
      throw new NotFoundException('Adoção não encontrada.');
    }

    if (adocao.devolvidoEm) {
      throw new BadRequestException('Adoção já foi devolvida.');
    }

    const animal = await this.animaisRepository.buscarPorId(adocao.animalId);

    if (!animal || !animal.ativo) {
      throw new NotFoundException('Animal não encontrado.');
    }

    if (
      animal.status !== StatusAnimal.ADOTADO ||
      animal.tutorId !== adocao.tutorId
    ) {
      throw new BadRequestException(
        'Adoção ativa inconsistente com o vínculo atual do animal.',
      );
    }

    const adocaoDevolvida = await this.adocoesRepository.devolver({
      id,
      animalId: adocao.animalId,
      tutorId: adocao.tutorId,
      devolvidoPorId: usuario.sub,
      observacoesDevolucao: dto.observacoes,
    });

    if (!adocaoDevolvida) {
      throw new BadRequestException(
        'Adoção não está disponível para devolução.',
      );
    }

    return AdocaoResponseDto.fromEntity(adocaoDevolvida);
  }
}
