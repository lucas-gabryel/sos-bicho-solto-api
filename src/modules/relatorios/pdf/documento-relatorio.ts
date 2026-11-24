// Estrutura neutra de um relatório: os montadores (builders) decidem o
// conteúdo e o RelatoriosPdfService só cuida da diagramação, garantindo o
// mesmo padrão visual para animais, adotantes e tutores.

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

export interface SecaoRelatorio {
  titulo: string;
  descricao?: string;
  tabelas: TabelaRelatorio[];
}

export interface FichaRelatorio {
  titulo: string;
  subtitulo: string;
  paragrafos: string[];
  tabelas: TabelaRelatorio[];
}

export interface DocumentoRelatorio {
  titulo: string;
  finalidade: string;
  geradoEm: Date;
  geradoPor: string;
  filtros: { rotulo: string; valor: string }[];
  indicadores: Indicador[];
  resumo: string[];
  secoes: SecaoRelatorio[];
  fichas: {
    titulo: string;
    descricao: string;
    itens: FichaRelatorio[];
    vazio: string;
  };
}
