import {
  formatarValor,
  graficoBarras,
  graficoColunas,
  graficoProgresso,
  graficoRosca,
  tetoAgradavel,
} from './graficos';

describe('graficos', () => {
  it.each([
    [0, true, 4],
    [3, true, 4],
    [5, true, 8],
    [23, true, 40],
    [1256, false, 2000],
    [700, false, 800],
  ])(
    'escolhe um teto de eixo com divisões redondas (%d -> %d)',
    (valor, inteiro, teto) => {
      expect(tetoAgradavel(valor, inteiro)).toBe(teto);
    },
  );

  it('formata valores monetários sem centavos nos gráficos', () => {
    expect(formatarValor(1255.5, 'moeda')).toBe('R$ 1.256');
    expect(formatarValor(2.5)).toBe('2,5');
  });

  it('desenha a rosca com legenda e escapa os textos', () => {
    const svg = graficoRosca(
      [
        { rotulo: 'Cães & gatos', valor: 3 },
        { rotulo: 'Outros', valor: 1 },
      ],
      240,
      { valor: '4', rotulo: 'animais' },
    );

    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Cães &amp; gatos');
    expect(svg).toContain('3 · 75%');
    expect(svg.match(/<path /g)).toHaveLength(2);
  });

  it('desenha uma fatia de 100% como anel completo e um anel vazio sem dados', () => {
    const cheio = graficoRosca([{ rotulo: 'Único', valor: 5 }], 240);
    const vazio = graficoRosca([{ rotulo: 'Nada', valor: 0 }], 240);

    expect(cheio.match(/<path /g)).toHaveLength(2);
    expect(vazio).toContain('<circle');
    expect(vazio).not.toContain('<path');
  });

  it('desenha colunas apenas para valores positivos', () => {
    const svg = graficoColunas(
      ['jan', 'fev', 'mar'],
      [{ nome: 'Entradas', valores: [2, 0, 1] }],
      400,
    );

    expect(svg.match(/<rect [^>]*rx="1.5"/g)).toHaveLength(2);
    expect(svg).toContain('>fev<');
  });

  it('desenha barras e progresso com um trilho por item', () => {
    const barras = graficoBarras(
      [
        { rotulo: 'Joana', valor: 450 },
        { rotulo: 'Marcos', valor: 200 },
      ],
      240,
      'moeda',
    );
    const progresso = graficoProgresso(
      [{ rotulo: 'Castrados', percentual: 0.6, texto: '3 de 5' }],
      240,
    );

    expect(barras).toContain('R$ 450');
    expect(barras.match(/<rect /g)).toHaveLength(4);
    expect(progresso).toContain('3 de 5');
  });
});
