import { DocumentoRelatorio } from './documento-relatorio';
import {
  RelatoriosPdfService,
  montarDefinicaoPdf,
} from './relatorios-pdf.service';

function documento(
  dados: Partial<DocumentoRelatorio> = {},
): DocumentoRelatorio {
  return {
    titulo: 'Relatório de Animais',
    finalidade: 'Entradas, adoções e cuidados dos animais.',
    geradoEm: new Date('2026-11-24T15:00:00Z'),
    geradoPor: 'Malba Vinicius',
    periodo: '01/11/2026 a 30/11/2026',
    filtros: [{ rotulo: 'Espécie', valor: 'Todas' }],
    indicadores: [
      { rotulo: 'Entradas', valor: '3', detalhe: '2 cães e 1 gato' },
      { rotulo: 'Adoções', valor: '1' },
    ],
    resumo: ['Entre 01/11/2026 e 30/11/2026, a ONG registrou 3 entradas.'],
    secoes: [
      {
        titulo: 'Evolução no período',
        graficos: [
          {
            tipo: 'colunas',
            titulo: 'Movimentação',
            categorias: ['01/11', '08/11'],
            series: [{ nome: 'Entradas', valores: [2, 1] }],
          },
          {
            tipo: 'rosca',
            titulo: 'Situação',
            fatias: [{ rotulo: 'Em acolhimento', valor: 3 }],
          },
          {
            tipo: 'barras',
            titulo: 'Sem dados',
            itens: [],
            vazio: 'Nenhuma guarda vigente.',
          },
        ],
      },
      {
        titulo: 'Movimentações',
        tabelas: [
          {
            titulo: 'Adoções',
            colunas: ['Data', 'Animal'],
            linhas: Array.from({ length: 40 }, (_, i) => [
              '15/11/2026',
              `Animal ${i} — ação`,
            ]),
            vazio: 'Nenhuma adoção.',
          },
          {
            titulo: 'Devoluções',
            colunas: ['Data', 'Animal'],
            linhas: [],
            vazio: 'Nenhuma devolução.',
          },
        ],
      },
    ],
    notas: ['A situação atual refere-se à data de emissão.'],
    ...dados,
  };
}

describe('RelatoriosPdfService', () => {
  const service = new RelatoriosPdfService();

  it('gera um PDF válido com capa, gráficos e várias páginas', async () => {
    const pdf = await service.gerar(documento());
    const conteudo = pdf.toString('latin1');

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(conteudo.match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(2);
    // Fonte embutida: o documento tem a mesma aparência em qualquer leitor.
    expect(conteudo).toContain('/FontFile2');
  });

  it('gera o PDF mesmo sem dados', async () => {
    const pdf = await service.gerar(
      documento({ indicadores: [], resumo: [], secoes: [], notas: [] }),
    );

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('omite cabeçalho e rodapé na capa e não a conta na numeração', () => {
    const definicao = montarDefinicaoPdf(documento());
    const rodape = definicao.footer as (a: number, t: number) => unknown;
    const cabecalho = definicao.header as (a: number) => unknown;

    expect(rodape(1, 5)).toBeNull();
    expect(cabecalho(1)).toBeNull();
    expect(JSON.stringify(rodape(2, 5))).toContain('Página 1 de 4');
    expect(JSON.stringify(rodape(2, 5))).toContain(
      'Emitido em 24/11/2026 às 12:00 por Malba Vinicius',
    );
  });

  it('lista as seções na capa e numera os títulos', () => {
    const conteudo = JSON.stringify(montarDefinicaoPdf(documento()).content);

    expect(conteudo).toContain('NESTE RELATÓRIO');
    expect(conteudo).toContain('"03  "');
    expect(conteudo).toContain('Movimentações');
    expect(conteudo).toContain('Nenhuma devolução.');
    expect(conteudo).toContain('Nenhuma guarda vigente.');
    expect(conteudo).not.toContain('Nenhuma adoção.');
  });
});
