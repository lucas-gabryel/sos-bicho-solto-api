import { Adocao } from '@prisma/client';

export const ADOCOES_REPOSITORY = Symbol('ADOCOES_REPOSITORY');

export interface RegistrarAdocaoData {
  animalId: string;
  tutorId: string;
  protetorId: string;
  observacoes?: string;
}

export interface RegistrarDevolucaoData {
  id: string;
  animalId: string;
  tutorId: string;
  devolvidoPorId: string;
  observacoesDevolucao?: string;
}

export interface ListarAdocoesParams {
  skip: number;
  take: number;
  tutorId?: string;
  animalId?: string;
  de?: Date;
  ate?: Date;
}

export interface IAdocoesRepository {
  buscarPorId(id: string): Promise<Adocao | null>;
  buscarAtivaPorAnimalId(animalId: string): Promise<Adocao | null>;
  listar(
    params: ListarAdocoesParams,
  ): Promise<{ data: Adocao[]; total: number }>;
  registrar(data: RegistrarAdocaoData): Promise<Adocao | null>;
  devolver(data: RegistrarDevolucaoData): Promise<Adocao | null>;
}
