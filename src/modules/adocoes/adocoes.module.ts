import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { AnimaisModule } from '#src/modules/animais/animais.module';
import { TutoresModule } from '#src/modules/tutores/tutores.module';
import { AdocoesController } from './adocoes.controller';
import { AdocoesService } from './adocoes.service';
import { AdocoesPrismaRepository } from './repositories/adocoes.prisma.repository';
import { ADOCOES_REPOSITORY } from './repositories/adocoes.repository.interface';

@Module({
  imports: [PrismaModule, AnimaisModule, TutoresModule],
  controllers: [AdocoesController],
  providers: [
    AdocoesService,
    {
      provide: ADOCOES_REPOSITORY,
      useClass: AdocoesPrismaRepository,
    },
  ],
})
export class AdocoesModule {}
