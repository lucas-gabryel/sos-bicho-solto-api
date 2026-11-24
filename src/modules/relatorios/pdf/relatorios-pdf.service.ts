import type {
  Content,
  CustomTableLayout,
  TDocumentDefinitions,
  TableCell,
} from 'pdfmake/interfaces';
import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import fontesPdfmake from 'pdfmake/build/vfs_fonts';
import { formatarDataHora } from '../utils/formatacao.util';
import {
  DocumentoRelatorio,
  Grafico,
  Indicador,
  SecaoRelatorio,
  TabelaRelatorio,
} from './documento-relatorio';
import {
  graficoBarras,
  graficoColunas,
  graficoProgresso,
  graficoRosca,
} from './graficos';
import { CORES_MARCA, fundoCapaSvg, logoSvg } from './identidade-visual';

// Roboto distribuída com o pdfmake, embutida no PDF: a aparência é a mesma em
// qualquer visualizador (as fontes padrão do PDF dependem de substituição).
const fonte = (arquivo: string) =>
  Buffer.from(fontesPdfmake[arquivo], 'base64');
const impressora = new PdfPrinter({
  Roboto: {
    normal: fonte('Roboto-Regular.ttf'),
    bold: fonte('Roboto-Medium.ttf'),
    italics: fonte('Roboto-Italic.ttf'),
    bolditalics: fonte('Roboto-MediumItalic.ttf'),
  },
});

const A4 = { largura: 595.28, altura: 841.89 };
const MARGEM = 40;
const LARGURA_UTIL = A4.largura - MARGEM * 2;

const CORES = {
  primaria: CORES_MARCA.primaria,
  texto: '#1E293B',
  suave: '#64748B',
  borda: '#F1E4DA',
  creme: '#FFF7ED',
  cremeForte: '#FFEDD5',
  marrom: '#7C2D12',
  zebra: '#FFFBF7',
};

const LAYOUT_TABELA: CustomTableLayout = {
  hLineWidth: (i, no) => (i === 0 || i === no.table.body.length ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => CORES.borda,
  fillColor: (linha) =>
    linha === 0 ? CORES.cremeForte : linha % 2 === 0 ? CORES.zebra : null,
  paddingLeft: () => 5,
  paddingRight: () => 5,
  paddingTop: () => 4,
  paddingBottom: () => 4,
};

// Cards separados por "linhas" brancas grossas, que funcionam como espaçamento.
const LAYOUT_CARDS: CustomTableLayout = {
  hLineWidth: () => 6,
  vLineWidth: () => 6,
  hLineColor: () => '#FFFFFF',
  vLineColor: () => '#FFFFFF',
  paddingLeft: () => 10,
  paddingRight: () => 10,
  paddingTop: () => 9,
  paddingBottom: () => 9,
};

const LAYOUT_PAINEL: CustomTableLayout = {
  hLineWidth: () => 0.8,
  vLineWidth: () => 0.8,
  hLineColor: () => CORES.borda,
  vLineColor: () => CORES.borda,
  paddingLeft: () => 12,
  paddingRight: () => 12,
  paddingTop: () => 10,
  paddingBottom: () => 10,
};

const LAYOUT_DESTAQUE: CustomTableLayout = {
  hLineWidth: () => 0,
  vLineWidth: (i) => (i === 0 ? 3 : 0),
  vLineColor: () => CORES.primaria,
  paddingLeft: () => 14,
  paddingRight: () => 12,
  paddingTop: () => 11,
  paddingBottom: () => 5,
};

function dividirEmLinhas<T>(itens: T[], porLinha: number): T[][] {
  const linhas: T[][] = [];
  for (let i = 0; i < itens.length; i += porLinha) {
    linhas.push(itens.slice(i, i + porLinha));
  }
  return linhas;
}

function secoesDoDocumento(documento: DocumentoRelatorio) {
  return ['Resumo executivo', ...documento.secoes.map((s) => s.titulo)].map(
    (texto, i) => ({ numero: String(i + 1).padStart(2, '0'), texto }),
  );
}

function montarCapa(documento: DocumentoRelatorio): Content[] {
  const info = (rotulo: string, valor: string): TableCell => ({
    stack: [
      { text: rotulo.toUpperCase(), style: 'rotulo', characterSpacing: 0.8 },
      { text: valor, bold: true, fontSize: 11, margin: [0, 3, 0, 0] },
    ],
  });
  const celulasInfo: TableCell[] = [
    info('Período analisado', documento.periodo),
    info('Emitido em', formatarDataHora(documento.geradoEm)),
    info('Emitido por', documento.geradoPor),
    ...documento.filtros.map((f) => info(f.rotulo, f.valor)),
  ];
  if (celulasInfo.length % 2 !== 0) celulasInfo.push({ text: '' });

  return [
    {
      svg: logoSvg(54, true),
      width: 54,
      absolutePosition: { x: MARGEM, y: 52 },
    },
    {
      stack: [
        {
          text: 'SOS BICHO SOLTO',
          bold: true,
          fontSize: 14,
          color: '#FFFFFF',
          characterSpacing: 1.5,
        },
        {
          text: 'Resgate, acolhimento e adoção responsável',
          fontSize: 9,
          color: CORES.cremeForte,
          margin: [0, 3, 0, 0],
        },
      ],
      absolutePosition: { x: MARGEM + 68, y: 64 },
    },
    {
      columns: [
        {
          width: 400,
          stack: [
            {
              text: 'RELATÓRIO GERENCIAL',
              bold: true,
              fontSize: 10,
              color: '#FED7AA',
              characterSpacing: 2.5,
            },
            {
              text: documento.titulo,
              bold: true,
              fontSize: 34,
              color: '#FFFFFF',
              lineHeight: 1,
              margin: [0, 8, 0, 14],
            },
            {
              text: documento.finalidade,
              fontSize: 11.5,
              color: CORES.creme,
              lineHeight: 1.35,
            },
          ],
        },
      ],
      absolutePosition: { x: MARGEM, y: 245 },
    },
    {
      table: {
        widths: [LARGURA_UTIL / 2 - 25, LARGURA_UTIL / 2 - 25],
        body: dividirEmLinhas(celulasInfo, 2),
      },
      layout: LAYOUT_PAINEL,
      absolutePosition: { x: MARGEM, y: 572 },
    },
    {
      stack: [
        {
          text: 'NESTE RELATÓRIO',
          style: 'rotulo',
          characterSpacing: 0.8,
          margin: [0, 0, 0, 6],
        },
        {
          columns: dividirEmLinhas(
            secoesDoDocumento(documento),
            Math.ceil(secoesDoDocumento(documento).length / 3),
          ).map((coluna) => ({
            stack: coluna.map((titulo) => ({
              text: [
                {
                  text: `${titulo.numero}  `,
                  bold: true,
                  color: CORES.primaria,
                },
                titulo.texto,
              ],
              fontSize: 9.5,
              margin: [0, 0, 0, 5] as [number, number, number, number],
            })),
          })),
        },
      ],
      absolutePosition: { x: MARGEM, y: 706 },
    },
    // A capa é toda posicionada; este marcador apenas encerra a página.
    { text: '', pageBreak: 'after' },
  ];
}

function tituloSecao(numero: number, titulo: string): Content {
  return {
    stack: [
      {
        columns: [
          {
            text: String(numero).padStart(2, '0'),
            width: 30,
            fontSize: 17,
            bold: true,
            color: CORES.primaria,
          },
          {
            text: titulo,
            fontSize: 15,
            bold: true,
            color: CORES.texto,
            margin: [0, 1, 0, 0],
          },
        ],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: LARGURA_UTIL,
            y2: 0,
            lineWidth: 0.6,
            lineColor: CORES.borda,
          },
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 30,
            y2: 0,
            lineWidth: 2,
            lineColor: CORES.primaria,
          },
        ],
        margin: [0, 5, 0, 0],
      },
    ],
    headlineLevel: 1,
    margin: [0, 14, 0, 8],
  };
}

function montarIndicadores(indicadores: Indicador[]): Content {
  // Tabela sem linhas quebra o layout do pdfmake.
  if (indicadores.length === 0) return { text: '' };
  const linhas = dividirEmLinhas(indicadores, 4).map((linha) => {
    const celulas = linha.map(
      (indicador): TableCell => ({
        fillColor: CORES.creme,
        stack: [
          {
            text: indicador.valor,
            fontSize: 19,
            bold: true,
            color: CORES.primaria,
          },
          {
            text: indicador.rotulo,
            bold: true,
            fontSize: 8,
            color: CORES.marrom,
            margin: [0, 2, 0, 0],
          },
          ...(indicador.detalhe
            ? [
                {
                  text: indicador.detalhe,
                  fontSize: 7,
                  color: CORES.suave,
                  margin: [0, 1, 0, 0] as [number, number, number, number],
                },
              ]
            : []),
        ],
      }),
    );
    while (celulas.length < 4) celulas.push({ text: '' });
    return celulas;
  });

  return {
    table: {
      widths: ['*', '*', '*', '*'],
      body: linhas,
      dontBreakRows: true,
    },
    layout: LAYOUT_CARDS,
    margin: [-6, 0, -6, 6],
  };
}

function montarResumo(paragrafos: string[]): Content {
  if (paragrafos.length === 0) return { text: '' };
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            fillColor: '#FAFAF9',
            stack: paragrafos.map(
              (paragrafo): Content => ({
                text: paragrafo,
                alignment: 'justify',
                lineHeight: 1.3,
                margin: [0, 0, 0, 6],
              }),
            ),
          },
        ],
      ],
    },
    layout: LAYOUT_DESTAQUE,
  };
}

function desenharGrafico(grafico: Grafico, largura: number): Content {
  switch (grafico.tipo) {
    case 'rosca':
      return {
        svg: graficoRosca(grafico.fatias, largura, grafico.centro),
        width: largura,
      };
    case 'colunas':
      return {
        svg: graficoColunas(
          grafico.categorias,
          grafico.series,
          largura,
          grafico.formato,
        ),
        width: largura,
      };
    case 'barras':
      return grafico.itens.length === 0
        ? { text: grafico.vazio ?? 'Sem dados.', style: 'vazio' }
        : {
            svg: graficoBarras(grafico.itens, largura, grafico.formato),
            width: largura,
          };
    case 'progresso':
      return grafico.itens.length === 0
        ? { text: grafico.vazio ?? 'Sem dados.', style: 'vazio' }
        : { svg: graficoProgresso(grafico.itens, largura), width: largura };
  }
}

// Gráficos de colunas (séries no tempo) ocupam a linha inteira; os demais
// são exibidos em pares.
function agruparGraficos(graficos: Grafico[]): Grafico[][] {
  const linhas: Grafico[][] = [];
  let par: Grafico[] = [];
  for (const grafico of graficos) {
    if (grafico.tipo === 'colunas') {
      linhas.push([grafico]);
      continue;
    }
    par.push(grafico);
    if (par.length === 2) {
      linhas.push(par);
      par = [];
    }
  }
  if (par.length) linhas.push(par);
  return linhas;
}

function montarGraficos(graficos: Grafico[]): Content[] {
  return agruparGraficos(graficos).map((linha): Content => {
    // Largura útil de cada card (descontando espaçamento entre cards e padding).
    const larguraCard = LARGURA_UTIL / linha.length - 26;
    return {
      table: {
        widths: linha.map(() => '*'),
        body: [
          linha.map(
            (grafico): TableCell => ({
              stack: [
                {
                  text: grafico.titulo,
                  bold: true,
                  fontSize: 9.5,
                  margin: [0, 0, 0, 8],
                },
                desenharGrafico(grafico, larguraCard),
              ],
            }),
          ),
        ],
        dontBreakRows: true,
      },
      layout: LAYOUT_PAINEL,
      margin: [0, 0, 0, 10],
    };
  });
}

// Tabelas até este tamanho não são divididas entre páginas.
const LINHAS_TABELA_INDIVISIVEL = 15;

// Bloco de conteúdo de uma seção; os indivisíveis nunca são partidos entre
// páginas (gráficos e tabelas pequenas).
interface Bloco {
  conteudo: Content[];
  indivisivel: boolean;
}

function montarTabela(tabela: TabelaRelatorio): Bloco {
  const titulo: Content[] = tabela.titulo
    ? [{ text: tabela.titulo, style: 'subtitulo', headlineLevel: 1 }]
    : [];
  if (tabela.linhas.length === 0) {
    return {
      conteudo: [...titulo, { text: tabela.vazio, style: 'vazio' }],
      indivisivel: true,
    };
  }
  const corpo: Content = {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths: tabela.larguras ?? tabela.colunas.map(() => '*'),
      body: [
        tabela.colunas.map(
          (coluna): TableCell => ({
            text: coluna.toUpperCase(),
            style: 'cabecalhoTabela',
          }),
        ),
        ...tabela.linhas,
      ],
    },
    layout: LAYOUT_TABELA,
    fontSize: 7.8,
    margin: [0, 0, 0, 12],
  };
  return {
    conteudo: [...titulo, corpo],
    indivisivel: tabela.linhas.length <= LINHAS_TABELA_INDIVISIVEL,
  };
}

function renderizarBloco(bloco: Bloco): Content[] {
  return bloco.indivisivel
    ? [{ unbreakable: true, stack: bloco.conteudo }]
    : bloco.conteudo;
}

function montarSecao(secao: SecaoRelatorio, numero: number): Content[] {
  const blocos: Bloco[] = [
    ...montarGraficos(secao.graficos ?? []).map((linha) => ({
      conteudo: [linha],
      indivisivel: true,
    })),
    ...(secao.tabelas ?? []).map(montarTabela),
  ];
  const [primeiro, ...demais] = blocos;
  const juntarAoTitulo = primeiro?.indivisivel ?? false;
  // Título e descrição ficam na mesma página do primeiro bloco da seção.
  const abertura: Content = {
    unbreakable: true,
    stack: [
      tituloSecao(numero, secao.titulo),
      ...(secao.descricao
        ? [{ text: secao.descricao, style: 'descricao' } as Content]
        : []),
      ...(juntarAoTitulo ? primeiro.conteudo : []),
    ],
  };
  return [
    abertura,
    ...(primeiro && !juntarAoTitulo ? renderizarBloco(primeiro) : []),
    ...demais.flatMap(renderizarBloco),
  ];
}

export function montarDefinicaoPdf(
  documento: DocumentoRelatorio,
): TDocumentDefinitions {
  const rodape = `Emitido em ${formatarDataHora(documento.geradoEm)} por ${documento.geradoPor}`;

  return {
    pageSize: 'A4',
    pageMargins: [MARGEM, 66, MARGEM, 50],
    info: {
      title: `${documento.titulo} - SOS Bicho Solto`,
      author: 'SOS Bicho Solto',
      subject: documento.finalidade,
      creator: 'SOS Bicho Solto',
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: CORES.texto,
      lineHeight: 1.2,
    },
    background: (pagina) =>
      pagina === 1
        ? { svg: fundoCapaSvg(A4.largura, A4.altura), width: A4.largura }
        : null,
    header: (pagina) =>
      pagina === 1
        ? null
        : {
            margin: [MARGEM, 24, MARGEM, 0],
            columns: [
              { svg: logoSvg(16), width: 16 },
              {
                text: 'SOS Bicho Solto',
                bold: true,
                color: CORES.primaria,
                fontSize: 9,
                margin: [6, 3, 0, 0],
              },
              {
                text: documento.titulo,
                alignment: 'right',
                color: CORES.suave,
                fontSize: 8,
                margin: [0, 3, 0, 0],
              },
            ],
          },
    // A capa não conta na numeração.
    footer: (pagina, total) =>
      pagina === 1
        ? null
        : {
            margin: [MARGEM, 16, MARGEM, 0],
            columns: [
              { text: rodape, color: CORES.suave, fontSize: 7 },
              {
                text: `Página ${pagina - 1} de ${total - 1}`,
                alignment: 'right',
                color: CORES.suave,
                fontSize: 7,
                width: 80,
              },
            ],
          },
    // Evita títulos de seção órfãos no pé da página.
    pageBreakBefore: (no, seguintesNaPagina) =>
      no.headlineLevel === 1 && seguintesNaPagina.length === 0,
    content: [
      ...montarCapa(documento),
      tituloSecao(1, 'Resumo executivo'),
      montarIndicadores(documento.indicadores),
      montarResumo(documento.resumo),
      ...documento.secoes.flatMap((secao, i) => montarSecao(secao, i + 2)),
      ...(documento.notas.length
        ? [
            {
              text: 'Notas metodológicas',
              style: 'subtitulo',
              margin: [0, 16, 0, 4],
            } as Content,
            {
              ul: documento.notas,
              fontSize: 7.5,
              color: CORES.suave,
            } as Content,
          ]
        : []),
    ],
    styles: {
      subtitulo: {
        fontSize: 10,
        bold: true,
        color: CORES.texto,
        margin: [0, 6, 0, 5],
      },
      descricao: { fontSize: 8.5, color: CORES.suave, margin: [0, 0, 0, 10] },
      rotulo: { fontSize: 7, color: CORES.suave },
      cabecalhoTabela: {
        bold: true,
        fontSize: 6.8,
        color: CORES.marrom,
        characterSpacing: 0.3,
      },
      vazio: {
        italics: true,
        color: CORES.suave,
        fontSize: 8,
        margin: [0, 0, 0, 12],
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
