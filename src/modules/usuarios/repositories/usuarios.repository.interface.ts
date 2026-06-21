import { Perfil, Usuario } from '@prisma/client';

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');

export interface CriarUsuarioData {
  nome: string;
  email: string;
  senhaHash: string;
  perfil?: Perfil;
  criadoPorId?: string | null;
  modificadoPorId?: string | null;
}

export interface AtualizarUsuarioData {
  nome?: string;
  email?: string;
  senhaHash?: string;
  perfil?: Perfil;
  ativo?: boolean;
  modificadoPorId?: string | null;
}

export interface ListarUsuariosParams {
  skip: number;
  take: number;
  perfil?: Perfil;
  busca?: string;
}

export interface IUsuariosRepository {
  criar(data: CriarUsuarioData): Promise<Usuario>;
  listar(params: ListarUsuariosParams): Promise<[Usuario[], number]>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  atualizar(id: string, data: AtualizarUsuarioData): Promise<Usuario>;
}
