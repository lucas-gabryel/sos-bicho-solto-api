// Estrutura neutra de um relatório: os montadores (builders) decidem o
// conteúdo e o RelatoriosPdfService só cuida da diagramação, garantindo o
// mesmo padrão visual (capa, seções, gráficos) em todos os relatórios.

export interface Indicador {
  rotulo: string;
  valor: string;
  detalhe?: string;
}

export interface TabelaRelatorio {
  titulo?: string;
  colunas: string[];
  // Larguras no formato do pdfmake ('*', 'auto' ou número em pontos).
  larguras?: (string | number)[];
  linhas: string[][];
  vazio: string;
}

export interface FatiaGrafico {
  rotulo: string;
  valor: number;
  cor?: string;
}

export interface SerieGrafico {
  nome: string;
  valores: number[];
  cor?: string;
}

export type FormatoValor = 'numero' | 'moeda';

export type Grafico =
  | {
      tipo: 'rosca';
      titulo: string;
      fatias: FatiaGrafico[];
      centro?: { valor: string; rotulo: string };
    }
  | {
      tipo: 'colunas';
      titulo: string;
      categorias: string[];
      series: SerieGrafico[];
      formato?: FormatoValor;
    }
  | {
      tipo: 'barras';
      titulo: string;
      itens: { rotulo: string; valor: number; texto?: string }[];
      formato?: FormatoValor;
      vazio?: string;
    }
  | {
      tipo: 'progresso';
      titulo: string;
      itens: { rotulo: string; percentual: number; texto: string }[];
      vazio?: string;
    };

export interface SecaoRelatorio {
  titulo: string;
  descricao?: string;
  // Exibidos lado a lado (dois por linha); um gráfico sozinho ocupa a largura toda.
  graficos?: Grafico[];
  tabelas?: TabelaRelatorio[];
}

export interface DocumentoRelatorio {
  titulo: string;
  finalidade: string;
  geradoEm: Date;
  geradoPor: string;
  periodo: string;
  filtros: { rotulo: string; valor: string }[];
  indicadores: Indicador[];
  resumo: string[];
  secoes: SecaoRelatorio[];
  notas: string[];
}
