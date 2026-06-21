import { Injectable } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { IUsuariosRepository } from './usuarios.repository.interface';

@Injectable()
export class UsuariosPrismaRepository implements IUsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }
}
