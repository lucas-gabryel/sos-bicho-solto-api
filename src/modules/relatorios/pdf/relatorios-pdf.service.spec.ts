import { DocumentoRelatorio } from './documento-relatorio';
import {
  RelatoriosPdfService,
  montarDefinicaoPdf,
} from './relatorios-pdf.service';

function documento(
  dados: Partial<DocumentoRelatorio> = {},
): DocumentoRelatorio {
  return {
    titulo: 'Relatório Histórico de Animais',
    finalidade: 'Consolida as movimentações dos animais.',
    geradoEm: new Date('2026-11-24T15:00:00Z'),
    geradoPor: 'Malba Vinicius',
    filtros: [{ rotulo: 'Período', valor: 'Todo o histórico' }],
    indicadores: [
      { rotulo: 'Entradas', valor: '3', detalhe: '2 cães e 1 gato' },
      { rotulo: 'Adoções', valor: '1' },
    ],
    resumo: ['Em todo o histórico registrado, a ONG registrou 3 entradas.'],
    secoes: [
      {
        titulo: 'Movimentações do período',
        tabelas: [
          {
            titulo: 'Adoções',
            colunas: ['Data', 'Animal'],
            linhas: [['15/11/2026', 'Mia (05.11.2026.1)']],
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
    fichas: {
      titulo: 'Fichas históricas',
      descricao: 'Todos os animais.',
      itens: Array.from({ length: 30 }, (_, i) => ({
        titulo: `Animal ${i} · Registro 0${i}`,
        subtitulo: 'Cão · Macho · SRD · Em acolhimento',
        paragrafos: ['Cão macho, raça SRD. Resgatado em Centro.'],
        tabelas: [
          {
            titulo: 'Linha do tempo',
            colunas: ['Data', 'Tipo', 'Descrição'],
            linhas: [['01/11/2026', 'Entrada', 'Entrada na ONG — ação']],
            vazio: '-',
          },
        ],
      })),
      vazio: 'Nenhum animal.',
    },
    ...dados,
  };
}

describe('RelatoriosPdfService', () => {
  const service = new RelatoriosPdfService();

  it('gera um PDF válido com várias páginas', async () => {
    const pdf = await service.gerar(documento());

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(
      pdf.toString('latin1').match(/\/Type \/Page\b/g)?.length,
    ).toBeGreaterThan(2);
  });

  it('gera o PDF mesmo sem dados', async () => {
    const pdf = await service.gerar(
      documento({
        indicadores: [],
        resumo: [],
        secoes: [],
        fichas: { titulo: 'Fichas', descricao: '', itens: [], vazio: 'Nada.' },
      }),
    );

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('padroniza cabeçalho, rodapé e metadados do documento', () => {
    const definicao = montarDefinicaoPdf(documento());
    const rodape = (definicao.footer as (a: number, t: number) => unknown)(
      2,
      5,
    );

    expect(definicao.info?.title).toBe(
      'Relatório Histórico de Animais - SOS Bicho Solto',
    );
    expect(JSON.stringify(rodape)).toContain(
      'Gerado em 24/11/2026 às 12:00 por Malba Vinicius',
    );
    expect(JSON.stringify(rodape)).toContain('Página 2 de 5');
  });

  it('mostra a mensagem de vazio no lugar de tabelas sem linhas', () => {
    const conteudo = JSON.stringify(montarDefinicaoPdf(documento()).content);

    expect(conteudo).toContain('Nenhuma devolução.');
    expect(conteudo).not.toContain('Nenhuma adoção.');
  });
});
