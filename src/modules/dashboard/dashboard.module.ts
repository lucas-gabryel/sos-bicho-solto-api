import { Module } from '@nestjs/common';
import { PrismaModule } from '#src/database/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardPrismaRepository } from './repositories/dashboard.prisma.repository';
import { DASHBOARD_REPOSITORY } from './repositories/dashboard.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: DashboardPrismaRepository,
    },
  ],
})
export class DashboardModule {}
