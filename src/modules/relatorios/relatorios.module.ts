import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { RelatoriosPdfService } from './pdf/relatorios-pdf.service';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosPrismaRepository } from './repositories/relatorios.prisma.repository';
import { RELATORIOS_REPOSITORY } from './repositories/relatorios.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [RelatoriosController],
  providers: [
    RelatoriosService,
    RelatoriosPdfService,
    {
      provide: RELATORIOS_REPOSITORY,
      useClass: RelatoriosPrismaRepository,
    },
  ],
})
export class RelatoriosModule {}
