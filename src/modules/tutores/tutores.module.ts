import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { UsuariosModule } from '#src/modules/usuarios/usuarios.module';
import { AnimaisModule } from '#src/modules/animais/animais.module';
import { TutoresController } from './tutores.controller';
import { TutoresService } from './tutores.service';
import { TutoresPrismaRepository } from './repositories/tutores.prisma.repository';
import { TUTORES_REPOSITORY } from './repositories/tutores.repository.interface';

@Module({
  imports: [PrismaModule, UsuariosModule, AnimaisModule],
  controllers: [TutoresController],
  providers: [
    TutoresService,
    {
      provide: TUTORES_REPOSITORY,
      useClass: TutoresPrismaRepository,
    },
  ],
  exports: [TutoresService, TUTORES_REPOSITORY],
})
export class TutoresModule {}
