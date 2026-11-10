import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { EstoquePrismaRepository } from './repositories/estoque.prisma.repository';
import { ESTOQUE_REPOSITORY } from './repositories/estoque.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [EstoqueController],
  providers: [
    EstoqueService,
    {
      provide: ESTOQUE_REPOSITORY,
      useClass: EstoquePrismaRepository,
    },
  ],
  exports: [EstoqueService, ESTOQUE_REPOSITORY],
})
export class EstoqueModule { }

