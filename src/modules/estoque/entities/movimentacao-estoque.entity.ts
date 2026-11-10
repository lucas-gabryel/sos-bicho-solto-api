import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';

export class MovimentacaoEstoque {
  id!: string;
  tipo!: TipoMovimentacaoEstoque;
  tipoItem!: TipoDoacao;
  descricaoItem!: string;
  quantidade!: number;
  unidadeMedida!: string;
  motivo!: string;
  dataMovimento!: Date;
  doacaoId?: string | null;
  registradoPorId?: string | null;
  registradoPorNome?: string | null;
  ativo!: boolean;
  criadoEm!: Date;
  modificadoEm!: Date;
}

