import { Prisma, TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { MovimentacaoEstoque } from '../entities/movimentacao-estoque.entity';

export const ESTOQUE_REPOSITORY = 'ESTOQUE_REPOSITORY';

export interface CriarMovimentacaoData {
  tipo: TipoMovimentacaoEstoque;
  tipoItem: TipoDoacao;
  descricaoItem: string;
  quantidade: number;
  unidadeMedida: string;
  motivo: string;
  doacaoId?: string | null;
  registradoPorId?: string | null;
  dataMovimento?: Date;
}

export interface ListarMovimentacoesFiltro {
  skip?: number;
  take?: number;
  tipo?: TipoMovimentacaoEstoque;
  tipoItem?: TipoDoacao;
  busca?: string;
}

export interface IEstoqueRepository {
  criar(
    data: CriarMovimentacaoData,
    tx?: Prisma.TransactionClient,
  ): Promise<MovimentacaoEstoque>;
  listar(
    filtro: ListarMovimentacoesFiltro,
  ): Promise<{ data: MovimentacaoEstoque[]; total: number }>;
  buscarPorId(id: string): Promise<MovimentacaoEstoque | null>;
  obterTodasAtivas(): Promise<MovimentacaoEstoque[]>;
  calcularSaldoItem(
    tipoItem: TipoDoacao,
    descricaoItem: string,
    unidadeMedida: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Prisma.Decimal>;
  bloquearItemParaMovimentacao(
    chaveItem: string,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  executarTransacao<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T>;
}

