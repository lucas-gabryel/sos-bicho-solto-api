import { Injectable } from '@nestjs/common';
import { StatusAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  DashboardResumoData,
  IDashboardRepository,
} from './dashboard.repository.interface';

@Injectable()
export class DashboardPrismaRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obterResumo(): Promise<DashboardResumoData> {
    const [totalAnimais, emAcolhimento, adotados, tutores] =
      await this.prisma.$transaction([
        this.prisma.animal.count({ where: { ativo: true } }),
        this.prisma.animal.count({
          where: { ativo: true, status: StatusAnimal.ACOLHIMENTO },
        }),
        this.prisma.animal.count({
          where: { ativo: true, status: StatusAnimal.ADOTADO },
        }),
        this.prisma.tutor.count({ where: { ativo: true } }),
      ]);

    return {
      totalAnimais,
      emAcolhimento,
      adotados,
      tutores,
    };
  }
}
