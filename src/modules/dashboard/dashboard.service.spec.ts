import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import {
  DASHBOARD_REPOSITORY,
  IDashboardRepository,
} from './repositories/dashboard.repository.interface';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<IDashboardRepository>;

  beforeEach(async () => {
    const repositoryMock: jest.Mocked<IDashboardRepository> = {
      obterResumo: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(DashboardService);
    repository = module.get(DASHBOARD_REPOSITORY);
  });

  it('retorna as métricas agregadas do dashboard', async () => {
    repository.obterResumo.mockResolvedValue({
      totalAnimais: 5,
      emAcolhimento: 3,
      adotados: 2,
      tutores: 12,
    });

    const result = await service.obterResumo();

    expect(repository.obterResumo).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totalAnimais: 5,
      emAcolhimento: 3,
      adotados: 2,
      tutores: 12,
    });
  });
});
