import { Tutor } from '@prisma/client';

export interface CriarTutorData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  dataNascimento: Date;
  criadoPorId?: string | null;
  modificadoPorId?: string | null;
}

export interface AtualizarTutorData {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  dataNascimento?: Date;
  ativo?: boolean;
  modificadoPorId?: string | null;
}

export interface ListarTutoresParams {
  skip: number;
  take: number;
  busca?: string;
}

export interface ITutoresRepository {
  criar(data: CriarTutorData): Promise<Tutor>;
  buscarPorId(id: string): Promise<Tutor | null>;
  buscarPorCpf(cpf: string): Promise<Tutor | null>;
  buscarPorEmail(email: string): Promise<Tutor | null>;
  listar(
    params: ListarTutoresParams,
  ): Promise<{ data: Tutor[]; total: number }>;
  atualizar(id: string, data: AtualizarTutorData): Promise<Tutor>;
  excluir(id: string, modificadoPorId: string): Promise<Tutor>;
}

export const TUTORES_REPOSITORY = 'TUTORES_REPOSITORY';
