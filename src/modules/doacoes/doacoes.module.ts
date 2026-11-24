import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { DoadoresModule } from '../doadores/doadores.module';
import { EstoqueModule } from '../estoque/estoque.module';
import { DoacoesController } from './doacoes.controller';
import { DoacoesService } from './doacoes.service';
import { DoacoesPrismaRepository } from './repositories/doacoes.prisma.repository';
import { DOACOES_REPOSITORY } from './repositories/doacoes.repository.interface';
import { RelatorioPdfService } from './services/relatorio-pdf.service';

@Module({
  imports: [PrismaModule, DoadoresModule, EstoqueModule],
  controllers: [DoacoesController],
  providers: [
    DoacoesService,
    RelatorioPdfService,
    {
      provide: DOACOES_REPOSITORY,
      useClass: DoacoesPrismaRepository,
    },
  ],
  exports: [DoacoesService, DOACOES_REPOSITORY],
})
export class DoacoesModule {}
