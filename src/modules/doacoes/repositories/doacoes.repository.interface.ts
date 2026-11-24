import { DirecaoDoacao, Doacao, Doador, Prisma, TipoDoacao, Usuario } from '@prisma/client';

export type DoacaoComRelacoes = Doacao & {
  doador?: Doador | null;
  registradoPor?: Usuario | null;
};

export interface CriarDoacaoData {
  tipo: TipoDoacao;
  direcao?: DirecaoDoacao;
  valor?: number | Prisma.Decimal | null;
  quantidade?: number | Prisma.Decimal | null;
  unidadeMedida?: string | null;
  descricao?: string | null;
  beneficiario?: string | null;
  dataRecebimento: Date;
  doadorId?: string | null;
  registradoPorId?: string | null;
  documentoUrl?: string | null;
  documentoNome?: string | null;
  documentoTipo?: string | null;
}

export interface ListarDoacoesParams {
  skip: number;
  take: number;
  tipo?: TipoDoacao;
  direcao?: DirecaoDoacao;
  doadorId?: string;
  busca?: string;
}

export interface FiltrosRelatorioParams {
  dataInicio?: Date;
  dataFim?: Date;
  tipo?: TipoDoacao;
  direcao?: DirecaoDoacao;
}

export interface IDoacoesRepository {
  criar(
    data: CriarDoacaoData,
    tx?: Prisma.TransactionClient,
  ): Promise<DoacaoComRelacoes>;
  buscarPorId(id: string): Promise<DoacaoComRelacoes | null>;
  listar(
    params: ListarDoacoesParams,
  ): Promise<{ data: DoacaoComRelacoes[]; total: number }>;
  buscarParaRelatorio(
    params: FiltrosRelatorioParams,
  ): Promise<DoacaoComRelacoes[]>;
  executarTransacao<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}

export const DOACOES_REPOSITORY = 'DOACOES_REPOSITORY';
