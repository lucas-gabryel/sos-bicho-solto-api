export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface DashboardResumoData {
  totalAnimais: number;
  emAcolhimento: number;
  adotados: number;
  tutores: number;
}

export interface IDashboardRepository {
  obterResumo(): Promise<DashboardResumoData>;
}
