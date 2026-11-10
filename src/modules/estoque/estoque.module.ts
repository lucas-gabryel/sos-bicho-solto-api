import { Module } from '@nestjs/common';
import { DatabaseModule } from '#src/database/database.module';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { EstoquePrismaRepository } from './repositories/estoque.prisma.repository';
import { ESTOQUE_REPOSITORY } from './repositories/estoque.repository.interface';

@Module({
  imports: [DatabaseModule],
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
export class EstoqueModule {}
