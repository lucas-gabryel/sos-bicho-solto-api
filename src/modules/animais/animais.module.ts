import { Module } from '@nestjs/common';
import { AnimaisController } from './animais.controller';
import { AnimaisService } from './animais.service';
import { AnimaisPrismaRepository } from './repositories/animais.prisma.repository';
import { ANIMAIS_REPOSITORY } from './repositories/animais.repository.interface';
import { PrismaModule } from '#src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnimaisController],
  providers: [
    AnimaisService,
    {
      provide: ANIMAIS_REPOSITORY,
      useClass: AnimaisPrismaRepository,
    },
  ],
  exports: [AnimaisService, ANIMAIS_REPOSITORY],
})
export class AnimaisModule {}
