import { Doacao, Doador, Prisma, TipoDoacao, Usuario } from '@prisma/client';

export type DoacaoComRelacoes = Doacao & {
  doador?: Doador | null;
  registradoPor?: Usuario | null;
};

export interface CriarDoacaoData {
  tipo: TipoDoacao;
  valor?: number | Prisma.Decimal | null;
  quantidade?: number | Prisma.Decimal | null;
  unidadeMedida?: string | null;
  descricao?: string | null;
  dataRecebimento: Date;
  doadorId?: string | null;
  registradoPorId?: string | null;
}

export interface ListarDoacoesParams {
  skip: number;
  take: number;
  tipo?: TipoDoacao;
  doadorId?: string;
  busca?: string;
}

export interface ObterRelatorioParams {
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoDoacao;
}

export interface AgrupamentoItemDoacao {
  tipo: TipoDoacao;
  quantidadeTotal: number;
  unidadeMedida: string | null;
}

export interface RelatorioDoacoesDados {
  totalDinheiro: number;
  itensAgrupados: AgrupamentoItemDoacao[];
  totalRegistros: number;
  doacoes: DoacaoComRelacoes[];
}

export interface IDoacoesRepository {
  criar(data: CriarDoacaoData): Promise<DoacaoComRelacoes>;
  buscarPorId(id: string): Promise<DoacaoComRelacoes | null>;
  listar(
    params: ListarDoacoesParams,
  ): Promise<{ data: DoacaoComRelacoes[]; total: number }>;
  obterRelatorio(params: ObterRelatorioParams): Promise<RelatorioDoacoesDados>;
}

export const DOACOES_REPOSITORY = 'DOACOES_REPOSITORY';
