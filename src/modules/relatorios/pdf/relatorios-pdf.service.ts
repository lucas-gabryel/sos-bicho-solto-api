import type {
  Content,
  CustomTableLayout,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces';
import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { formatarDataHora } from '../utils/formatacao.util';
import {
  DocumentoRelatorio,
  FichaRelatorio,
  Indicador,
  TabelaRelatorio,
} from './documento-relatorio';

// Fontes padrão do PDF (sem arquivos .ttf): suportam acentuação em português.
const impressora = new PdfPrinter({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

const CORES = {
  primaria: '#c2410c',
  texto: '#1e293b',
  suave: '#64748b',
  borda: '#e2e8f0',
  fundo: '#f8fafc',
  cabecalhoTabela: '#f1f5f9',
  destaque: '#fff7ed',
};

const LAYOUT_TABELA: CustomTableLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0,
  hLineColor: () => CORES.borda,
  fillColor: (linha) =>
    linha === 0 ? CORES.cabecalhoTabela : linha % 2 === 0 ? CORES.fundo : null,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

const LAYOUT_CAIXA: CustomTableLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => CORES.borda,
  vLineColor: () => CORES.borda,
  paddingLeft: () => 8,
  paddingRight: () => 8,
  paddingTop: () => 6,
  paddingBottom: () => 6,
};

function dividirEmLinhas<T>(itens: T[], porLinha: number): T[][] {
  const linhas: T[][] = [];
  for (let i = 0; i < itens.length; i += porLinha) {
    linhas.push(itens.slice(i, i + porLinha));
  }
  return linhas;
}

function montarFiltros(documento: DocumentoRelatorio): Content {
  return {
    table: {
      widths: documento.filtros.map(() => '*'),
      body: [
        documento.filtros.map(
          (filtro): TableCell => ({
            stack: [
              { text: filtro.rotulo.toUpperCase(), style: 'rotulo' },
              { text: filtro.valor, bold: true },
            ],
            fillColor: CORES.fundo,
          }),
        ),
      ],
    },
    layout: LAYOUT_CAIXA,
    margin: [0, 0, 0, 14],
  };
}

function montarIndicadores(indicadores: Indicador[]): Content {
  // Tabela sem linhas quebra o layout do pdfmake.
  if (indicadores.length === 0) return { text: '' };
  const porLinha =
    indicadores.length % 4 !== 0 && indicadores.length % 3 === 0 ? 3 : 4;
  const linhas = dividirEmLinhas(indicadores, porLinha).map((linha) => {
    const celulas = linha.map(
      (indicador): TableCell => ({
        stack: [
          {
            text: indicador.valor,
            fontSize: 15,
            bold: true,
            color: CORES.primaria,
          },
          { text: indicador.rotulo, bold: true, fontSize: 8 },
          ...(indicador.detalhe
            ? [{ text: indicador.detalhe, style: 'rotulo' }]
            : []),
        ],
      }),
    );
    while (celulas.length < porLinha) {
      celulas.push({ text: '', border: [false, false, false, false] });
    }
    return celulas;
  });

  return {
    table: {
      widths: Array.from({ length: porLinha }, () => '*'),
      body: linhas,
      dontBreakRows: true,
    },
    layout: LAYOUT_CAIXA,
    margin: [0, 0, 0, 14],
  };
}

function montarTabela(tabela: TabelaRelatorio): Content[] {
  const conteudo: Content[] = [];
  if (tabela.titulo) {
    conteudo.push({
      text: tabela.titulo,
      style: 'subtitulo',
      headlineLevel: 1,
    });
  }
  if (tabela.linhas.length === 0) {
    conteudo.push({ text: tabela.vazio, style: 'vazio' });
    return conteudo;
  }
  conteudo.push({
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: tabela.larguras ?? tabela.colunas.map(() => '*'),
      body: [
        tabela.colunas.map(
          (coluna): TableCell => ({ text: coluna, style: 'cabecalhoTabela' }),
        ),
        ...tabela.linhas,
      ],
    },
    layout: LAYOUT_TABELA,
    fontSize: 7.5,
    margin: [0, 0, 0, 10],
  });
  return conteudo;
}

function montarFicha(ficha: FichaRelatorio): Content {
  return {
    stack: [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: ficha.titulo, bold: true, fontSize: 10.5 },
                  { text: ficha.subtitulo, style: 'rotulo' },
                ],
                fillColor: CORES.destaque,
              },
            ],
          ],
        },
        layout: 'noBorders',
        headlineLevel: 1,
        margin: [0, 0, 0, 6],
      },
      ...ficha.paragrafos.map(
        (paragrafo): Content => ({ text: paragrafo, style: 'paragrafo' }),
      ),
      ...ficha.tabelas.flatMap(montarTabela),
    ],
    margin: [0, 0, 0, 12],
  };
}

export function montarDefinicaoPdf(
  documento: DocumentoRelatorio,
): TDocumentDefinitions {
  const rodape = `Gerado em ${formatarDataHora(documento.geradoEm)} por ${documento.geradoPor} · SOS Bicho Solto`;

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 50],
    info: {
      title: `${documento.titulo} - SOS Bicho Solto`,
      author: 'SOS Bicho Solto',
      subject: documento.finalidade,
      creator: 'SOS Bicho Solto',
    },
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 9,
      color: CORES.texto,
      lineHeight: 1.2,
    },
    header: () => ({
      margin: [40, 24, 40, 0],
      columns: [
        {
          text: 'SOS BICHO SOLTO',
          bold: true,
          color: CORES.primaria,
          fontSize: 10,
        },
        {
          text: documento.titulo,
          alignment: 'right',
          color: CORES.suave,
          fontSize: 8,
        },
      ],
    }),
    footer: (paginaAtual, totalPaginas) => ({
      margin: [40, 16, 40, 0],
      columns: [
        { text: rodape, color: CORES.suave, fontSize: 7 },
        {
          text: `Página ${paginaAtual} de ${totalPaginas}`,
          alignment: 'right',
          color: CORES.suave,
          fontSize: 7,
          width: 80,
        },
      ],
    }),
    // Evita títulos de seção/ficha órfãos no pé da página.
    pageBreakBefore: (no, seguintesNaPagina) =>
      no.headlineLevel === 1 && seguintesNaPagina.length === 0,
    content: [
      { text: documento.titulo, style: 'titulo' },
      { text: documento.finalidade, style: 'finalidade' },
      montarFiltros(documento),
      { text: 'Indicadores', style: 'secao', headlineLevel: 1 },
      {
        text: 'Movimentações referem-se ao período filtrado; situação atual refere-se à data de emissão.',
        style: 'descricao',
      },
      montarIndicadores(documento.indicadores),
      { text: 'Resumo', style: 'secao', headlineLevel: 1 },
      ...documento.resumo.map(
        (paragrafo): Content => ({ text: paragrafo, style: 'paragrafo' }),
      ),
      ...documento.secoes.flatMap((secao): Content[] => [
        { text: secao.titulo, style: 'secao', headlineLevel: 1 },
        ...(secao.descricao
          ? [{ text: secao.descricao, style: 'descricao' }]
          : []),
        ...secao.tabelas.flatMap(montarTabela),
      ]),
      {
        text: documento.fichas.titulo,
        style: 'secao',
        pageBreak: 'before',
      },
      { text: documento.fichas.descricao, style: 'descricao' },
      ...(documento.fichas.itens.length
        ? documento.fichas.itens.map(montarFicha)
        : [{ text: documento.fichas.vazio, style: 'vazio' }]),
    ],
    styles: {
      titulo: { fontSize: 17, bold: true, margin: [0, 0, 0, 4] },
      finalidade: { color: CORES.suave, margin: [0, 0, 0, 12] },
      secao: {
        fontSize: 12,
        bold: true,
        color: CORES.primaria,
        margin: [0, 8, 0, 4],
      },
      subtitulo: { fontSize: 9.5, bold: true, margin: [0, 4, 0, 4] },
      descricao: { fontSize: 8, color: CORES.suave, margin: [0, 0, 0, 8] },
      paragrafo: { alignment: 'justify', margin: [0, 0, 0, 6] },
      rotulo: { fontSize: 7, color: CORES.suave },
      cabecalhoTabela: { bold: true, fontSize: 7.5 },
      vazio: {
        italics: true,
        color: CORES.suave,
        fontSize: 8,
        margin: [0, 0, 0, 10],
      },
    },
  };
}

@Injectable()
export class RelatoriosPdfService {
  gerar(documento: DocumentoRelatorio): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = impressora.createPdfKitDocument(
        montarDefinicaoPdf(documento),
      );
      const partes: Buffer[] = [];
      pdf.on('data', (parte: Buffer) => partes.push(parte));
      pdf.on('end', () => resolve(Buffer.concat(partes)));
      pdf.on('error', reject);
      pdf.end();
    });
  }
}
