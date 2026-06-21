import { Injectable } from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  AtualizarUsuarioData,
  CriarUsuarioData,
  IUsuariosRepository,
  ListarUsuariosParams,
} from './usuarios.repository.interface';

@Injectable()
export class UsuariosPrismaRepository implements IUsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(data: CriarUsuarioData): Promise<Usuario> {
    return this.prisma.usuario.create({ data });
  }

  listar({
    skip,
    take,
    perfil,
    busca,
  }: ListarUsuariosParams): Promise<[Usuario[], number]> {
    const where: Prisma.UsuarioWhereInput = {
      ativo: true,
      ...(perfil && { perfil }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);
  }

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  atualizar(id: string, data: AtualizarUsuarioData): Promise<Usuario> {
    return this.prisma.usuario.update({ where: { id }, data });
  }
}
