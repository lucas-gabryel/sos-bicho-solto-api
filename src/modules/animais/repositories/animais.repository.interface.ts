import { Animal } from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';

export interface IAnimaisRepository {
  criar(dto: CriarAnimalDto): Promise<Animal>;
  buscarPorId(id: string): Promise<Animal | null>;
  listar(
    skip: number,
    take: number,
  ): Promise<{ data: Animal[]; total: number }>;
  atualizar(id: string, dto: AtualizarAnimalDto): Promise<Animal>;
  excluir(id: string): Promise<Animal>;
  buscarPorEspecie(
    especie: string,
    skip: number,
    take: number,
  ): Promise<{ data: Animal[]; total: number }>;
  buscarPorStatus(
    status: string,
    skip: number,
    take: number,
  ): Promise<{ data: Animal[]; total: number }>;
}

export const ANIMAIS_REPOSITORY = 'ANIMAIS_REPOSITORY';
