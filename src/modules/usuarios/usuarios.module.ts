import { Module } from '@nestjs/common';
import { UsuariosPrismaRepository } from './repositories/usuarios.prisma.repository';
import { USUARIOS_REPOSITORY } from './repositories/usuarios.repository.interface';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORY, useClass: UsuariosPrismaRepository },
  ],
  exports: [USUARIOS_REPOSITORY],
})
export class UsuariosModule {}
