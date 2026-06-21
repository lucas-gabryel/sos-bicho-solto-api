import { Module } from '@nestjs/common';
import { UsuariosPrismaRepository } from './repositories/usuarios.prisma.repository';
import { USUARIOS_REPOSITORY } from './repositories/usuarios.repository.interface';

@Module({
  providers: [{ provide: USUARIOS_REPOSITORY, useClass: UsuariosPrismaRepository }],
  exports: [USUARIOS_REPOSITORY],
})
export class UsuariosModule {}
