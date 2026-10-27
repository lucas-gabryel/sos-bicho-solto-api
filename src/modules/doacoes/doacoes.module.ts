import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { DoadoresModule } from '#src/modules/doadores/doadores.module';
import { DoacoesController } from './doacoes.controller';
import { DoacoesService } from './doacoes.service';
import { DoacoesPrismaRepository } from './repositories/doacoes.prisma.repository';
import { DOACOES_REPOSITORY } from './repositories/doacoes.repository.interface';
import { RelatorioPdfService } from './services/relatorio-pdf.service';

@Module({
  imports: [PrismaModule, DoadoresModule],
  controllers: [DoacoesController],
  providers: [
    DoacoesService,
    RelatorioPdfService,
    {
      provide: DOACOES_REPOSITORY,
      useClass: DoacoesPrismaRepository,
    },
  ],
  exports: [DoacoesService, DOACOES_REPOSITORY, RelatorioPdfService],
})
export class DoacoesModule {}
