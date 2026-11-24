import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  StatusAnimal,
  TipoDoacao,
  TipoEventoAnimal,
  TipoMovimentacaoEstoque,
} from '@prisma/client';

export const RELATORIOS_REPOSITORY = Symbol('RELATORIOS_REPOSITORY');

export interface EventoRelatorio {
  dataEvento: Date;
  tipo: TipoEventoAnimal;
  motivoSaida: MotivoSaidaAnimal | null;
  descricao: string;
}

export interface AdocaoRelatorio {
  dataAdocao: Date;
  devolvidoEm: Date | null;
  observacoesDevolucao: string | null;
  protetor: string;
  tutor: { codigo: number; nome: string };
  animal: {
    nome: string;
    numeroRegistro: string;
    especie: EspecieAnimal;
    criadoEm: Date;
    // Datas de entrada (resgate e retornos) usadas para medir o tempo em
    // acolhimento até cada adoção.
    entradas: Date[];
  };
}

export interface AnimalRelatorio {
  numeroRegistro: string;
  nome: string;
  especie: EspecieAnimal;
  castrado: boolean;
  vacinado: boolean;
  localResgate: string;
  status: StatusAnimal;
  criadoEm: Date;
  eventos: EventoRelatorio[];
  adocoes: AdocaoRelatorio[];
}

export interface AnimalVinculadoRelatorio {
  numeroRegistro: string;
  nome: string;
  especie: EspecieAnimal;
  status: StatusAnimal;
}

export interface AcolhedorRelatorio {
  codigo: number;
  nome: string;
  telefone: string;
  criadoEm: Date;
  adocoes: AdocaoRelatorio[];
  animaisVinculados: AnimalVinculadoRelatorio[];
}

export interface DoacaoRelatorio {
  tipo: TipoDoacao;
  valor: number | null;
  quantidade: number | null;
  unidadeMedida: string | null;
  descricao: string | null;
  // Data civil (sem hora) ancorada ao meio-dia local, para cair no dia certo
  // nas comparações de período.
  dataRecebimento: Date;
  doador: { id: string; nome: string } | null;
}

export interface MovimentacaoEstoqueRelatorio {
  tipo: TipoMovimentacaoEstoque;
  tipoItem: TipoDoacao;
  descricaoItem: string;
  quantidade: number;
  unidadeMedida: string;
  dataMovimento: Date;
}

// Os relatórios trazem o histórico completo e filtram/agregam em memória:
// indicadores do período, situação atual e tabelas saem da mesma fonte, o que
// mantém os números consistentes entre si (volume compatível com uma ONG).
export interface IRelatoriosRepository {
  buscarAnimais(especie?: EspecieAnimal): Promise<AnimalRelatorio[]>;
  buscarAcolhedores(): Promise<AcolhedorRelatorio[]>;
  buscarDoacoes(): Promise<DoacaoRelatorio[]>;
  // Em ordem cronológica, como exige o cálculo de saldo do estoque.
  buscarMovimentacoesEstoque(): Promise<MovimentacaoEstoqueRelatorio[]>;
  buscarNomeUsuario(id: string): Promise<string | null>;
}
