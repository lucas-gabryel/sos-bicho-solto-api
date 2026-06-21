import { Usuario } from '@prisma/client';

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');

export interface IUsuariosRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
}
