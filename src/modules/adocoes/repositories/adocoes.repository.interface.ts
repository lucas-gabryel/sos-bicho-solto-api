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
  devolvidoPorId: string;
  observacoesDevolucao?: string;
}

export interface IAdocoesRepository {
  buscarPorId(id: string): Promise<Adocao | null>;
  buscarAtivaPorAnimalId(animalId: string): Promise<Adocao | null>;
  registrar(data: RegistrarAdocaoData): Promise<Adocao>;
  devolver(data: RegistrarDevolucaoData): Promise<Adocao>;
}
