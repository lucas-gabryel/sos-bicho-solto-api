import {
  Animal,
  EspecieAnimal,
  StatusAnimal,
  FotoAnimal,
} from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';

export interface ListarAnimaisParams {
  skip: number;
  take: number;
  especie?: EspecieAnimal;
  status?: StatusAnimal;
  busca?: string;
  tutorId?: string;
}

export interface IAnimaisRepository {
  criar(
    dto: CriarAnimalDto,
    criadoPorId: string,
  ): Promise<Animal & { fotos: FotoAnimal[] }>;
  buscarPorId(id: string): Promise<(Animal & { fotos: FotoAnimal[] }) | null>;
  listar(
    params: ListarAnimaisParams,
  ): Promise<{ data: (Animal & { fotos: FotoAnimal[] })[]; total: number }>;
  atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    modificadoPorId: string,
  ): Promise<Animal & { fotos: FotoAnimal[] }>;
  excluir(id: string, modificadoPorId: string): Promise<Animal>;

  adicionarFoto(
    animalId: string,
    url: string,
    principal: boolean,
    criadoPorId: string,
  ): Promise<FotoAnimal>;
  removerFoto(fotoId: string, modificadoPorId: string): Promise<FotoAnimal>;
  definirFotoPrincipal(
    animalId: string,
    fotoId: string,
    modificadoPorId: string,
  ): Promise<void>;
  buscarFotoPorId(fotoId: string): Promise<FotoAnimal | null>;
}

export const ANIMAIS_REPOSITORY = 'ANIMAIS_REPOSITORY';
