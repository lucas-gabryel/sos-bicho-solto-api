import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { UsuariosModule } from '#src/modules/usuarios/usuarios.module';
import { DoadoresController } from './doadores.controller';
import { DoadoresService } from './doadores.service';
import { DoadoresPrismaRepository } from './repositories/doadores.prisma.repository';
import { DOADORES_REPOSITORY } from './repositories/doadores.repository.interface';

@Module({
  imports: [PrismaModule, UsuariosModule],
  controllers: [DoadoresController],
  providers: [
    DoadoresService,
    {
      provide: DOADORES_REPOSITORY,
      useClass: DoadoresPrismaRepository,
    },
  ],
  exports: [DoadoresService, DOADORES_REPOSITORY],
})
export class DoadoresModule {}
