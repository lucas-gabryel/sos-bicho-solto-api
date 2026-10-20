import { Doador } from '@prisma/client';

export interface CriarDoadorData {
  nomeRazaoSocial: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  criadoPorId?: string | null;
  modificadoPorId?: string | null;
}

export interface AtualizarDoadorData {
  nomeRazaoSocial?: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo?: boolean;
  modificadoPorId?: string | null;
}

export interface ListarDoadoresParams {
  skip: number;
  take: number;
  busca?: string;
}

export interface IDoadoresRepository {
  criar(data: CriarDoadorData): Promise<Doador>;
  buscarPorId(id: string): Promise<Doador | null>;
  buscarPorCpfCnpj(cpfCnpj: string): Promise<Doador | null>;
  listar(
    params: ListarDoadoresParams,
  ): Promise<{ data: Doador[]; total: number }>;
  atualizar(id: string, data: AtualizarDoadorData): Promise<Doador>;
  excluir(id: string, modificadoPorId: string): Promise<Doador>;
}

export const DOADORES_REPOSITORY = 'DOADORES_REPOSITORY';
