import type { IDashboardRepository } from './repositories/dashboard.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { DashboardResumoDto } from './dto/dashboard-resumo.dto';
import { DASHBOARD_REPOSITORY } from './repositories/dashboard.repository.interface';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
  ) {}

  async obterResumo(): Promise<DashboardResumoDto> {
    const resumo = await this.dashboardRepository.obterResumo();
    return DashboardResumoDto.fromData(resumo);
  }
}
