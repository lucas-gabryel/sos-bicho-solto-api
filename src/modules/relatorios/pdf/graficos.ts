import {
  FatiaGrafico,
  FormatoValor,
  SerieGrafico,
} from './documento-relatorio';

// Gráficos desenhados como SVG (vetorial, nítido na impressão) e embutidos no
// PDF pelo pdfmake. Os textos usam a fonte Helvetica do documento.

export const PALETA = {
  laranja: '#EA580C',
  laranjaEscuro: '#9A3412',
  ambar: '#F59E0B',
  verde: '#16A34A',
  azul: '#2563EB',
  teal: '#0D9488',
  roxo: '#7C3AED',
  cinza: '#94A3B8',
  trilho: '#F1F5F9',
  grade: '#E2E8F0',
  texto: '#1E293B',
  suave: '#64748B',
};

const CORES_PADRAO = [
  PALETA.laranja,
  PALETA.teal,
  PALETA.ambar,
  PALETA.azul,
  PALETA.roxo,
  PALETA.cinza,
];

const FONTE = 'font-family="Roboto"';

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncar(texto: string, limite: number): string {
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
}

export function formatarValor(valor: number, formato: FormatoValor = 'numero') {
  if (formato === 'moeda') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      // Nos gráficos, centavos só poluem os rótulos.
      maximumFractionDigits: 0,
    }).format(valor);
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
    valor,
  );
}

function texto(
  x: number,
  y: number,
  conteudo: string,
  {
    tamanho = 8,
    cor = PALETA.texto,
    ancora = 'start',
    negrito = false,
  }: {
    tamanho?: number;
    cor?: string;
    ancora?: 'start' | 'middle' | 'end';
    negrito?: boolean;
  } = {},
) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${FONTE} font-size="${tamanho}" fill="${cor}" text-anchor="${ancora}"${negrito ? ' font-weight="bold"' : ''}>${escapar(conteudo)}</text>`;
}

function svg(largura: number, altura: number, conteudo: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">${conteudo}</svg>`;
}

const DIVISOES_EIXO = 4;

// Teto do eixo com divisões "redondas" (passos de 1, 2, 2,5 ou 5 × 10ⁿ);
// contagens usam passos inteiros. Ex.: 5 -> 8 (passo 2), 1.256 -> 1.600.
export function tetoAgradavel(valor: number, inteiro = true): number {
  if (valor <= 0) return DIVISOES_EIXO;
  const bruto = valor / DIVISOES_EIXO;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  let passo =
    [1, 2, 2.5, 5, 10].map((p) => p * magnitude).find((p) => p >= bruto) ??
    10 * magnitude;
  if (inteiro) passo = Math.max(1, Math.ceil(passo));
  return passo * DIVISOES_EIXO;
}

function arco(
  cx: number,
  cy: number,
  externo: number,
  interno: number,
  inicio: number,
  fim: number,
) {
  const ponto = (raio: number, angulo: number) => [
    cx + raio * Math.cos(angulo - Math.PI / 2),
    cy + raio * Math.sin(angulo - Math.PI / 2),
  ];
  const grande = fim - inicio > Math.PI ? 1 : 0;
  const [x1, y1] = ponto(externo, inicio);
  const [x2, y2] = ponto(externo, fim);
  const [x3, y3] = ponto(interno, fim);
  const [x4, y4] = ponto(interno, inicio);
  return (
    `M${x1.toFixed(2)},${y1.toFixed(2)} A${externo},${externo} 0 ${grande} 1 ${x2.toFixed(2)},${y2.toFixed(2)} ` +
    `L${x3.toFixed(2)},${y3.toFixed(2)} A${interno},${interno} 0 ${grande} 0 ${x4.toFixed(2)},${y4.toFixed(2)} Z`
  );
}

export function graficoRosca(
  fatias: FatiaGrafico[],
  largura: number,
  centro?: { valor: string; rotulo: string },
): string {
  const linhaLegenda = 24;
  const raio = Math.min(54, largura * 0.21);
  const altura = Math.max(raio * 2 + 8, fatias.length * linhaLegenda + 8);
  const cx = raio + 4;
  const cy = altura / 2;
  const total = fatias.reduce((soma, f) => soma + f.valor, 0);
  let conteudo = '';

  if (total === 0) {
    conteudo += `<circle cx="${cx}" cy="${cy}" r="${raio - 11}" fill="none" stroke="${PALETA.trilho}" stroke-width="22"/>`;
  } else {
    let angulo = 0;
    fatias.forEach((fatia, i) => {
      if (fatia.valor <= 0) return;
      const cor = fatia.cor ?? CORES_PADRAO[i % CORES_PADRAO.length];
      // Uma fatia de 100% é desenhada em duas metades (arco SVG não fecha 360°).
      const fim = angulo + (fatia.valor / total) * Math.PI * 2;
      if (fatia.valor === total) {
        conteudo += `<path d="${arco(cx, cy, raio, raio - 22, 0, Math.PI)}" fill="${cor}"/>`;
        conteudo += `<path d="${arco(cx, cy, raio, raio - 22, Math.PI, Math.PI * 2)}" fill="${cor}"/>`;
      } else {
        conteudo += `<path d="${arco(cx, cy, raio, raio - 22, angulo, fim)}" fill="${cor}" stroke="#FFFFFF" stroke-width="1.5"/>`;
      }
      angulo = fim;
    });
  }

  if (centro) {
    conteudo += texto(cx, cy + 2, centro.valor, {
      tamanho: 15,
      negrito: true,
      ancora: 'middle',
    });
    conteudo += texto(cx, cy + 13, centro.rotulo, {
      tamanho: 6.5,
      cor: PALETA.suave,
      ancora: 'middle',
    });
  }

  // Legenda em duas linhas (rótulo e valor) para caber em cards estreitos.
  const legendaX = cx + raio + 16;
  const legendaY = cy - (fatias.length * linhaLegenda) / 2 + 9;
  fatias.forEach((fatia, i) => {
    const y = legendaY + i * linhaLegenda;
    const cor = fatia.cor ?? CORES_PADRAO[i % CORES_PADRAO.length];
    const percentual =
      total > 0 ? ` · ${Math.round((fatia.valor / total) * 100)}%` : '';
    conteudo += `<rect x="${legendaX}" y="${y - 7}" width="8" height="8" rx="2" fill="${cor}"/>`;
    conteudo += texto(legendaX + 13, y, truncar(fatia.rotulo, 28), {
      tamanho: 8,
    });
    conteudo += texto(legendaX + 13, y + 10, `${fatia.valor}${percentual}`, {
      tamanho: 7.5,
      negrito: true,
      cor: PALETA.suave,
    });
  });

  return svg(largura, altura, conteudo);
}

export function graficoColunas(
  categorias: string[],
  series: SerieGrafico[],
  largura: number,
  formato: FormatoValor = 'numero',
): string {
  const altura = 170;
  const margem = {
    esquerda: formato === 'moeda' ? 50 : 26,
    topo: 26,
    base: 22,
  };
  const areaLargura = largura - margem.esquerda - 4;
  const areaAltura = altura - margem.topo - margem.base;
  const maximo = tetoAgradavel(
    Math.max(0, ...series.flatMap((s) => s.valores)),
    formato === 'numero',
  );
  let conteudo = '';

  // Legenda
  let legendaX = margem.esquerda;
  series.forEach((serie, i) => {
    const cor = serie.cor ?? CORES_PADRAO[i % CORES_PADRAO.length];
    conteudo += `<rect x="${legendaX}" y="4" width="8" height="8" rx="2" fill="${cor}"/>`;
    conteudo += texto(legendaX + 12, 11, serie.nome, { tamanho: 7.5 });
    legendaX += 22 + serie.nome.length * 4.2;
  });

  // Grade e eixo Y
  for (let i = 0; i <= DIVISOES_EIXO; i++) {
    const valor = (maximo / DIVISOES_EIXO) * i;
    const y = margem.topo + areaAltura - (areaAltura / DIVISOES_EIXO) * i;
    conteudo += `<line x1="${margem.esquerda}" y1="${y.toFixed(1)}" x2="${largura - 4}" y2="${y.toFixed(1)}" stroke="${PALETA.grade}" stroke-width="0.6"/>`;
    conteudo += texto(
      margem.esquerda - 5,
      y + 2.5,
      formatarValor(valor, formato),
      {
        tamanho: 6.5,
        cor: PALETA.suave,
        ancora: 'end',
      },
    );
  }

  const grupo = areaLargura / Math.max(categorias.length, 1);
  const larguraBarra = Math.min(
    16,
    (grupo * 0.72) / Math.max(series.length, 1),
  );
  const tamanhoRotulo = categorias.length > 8 ? 6 : 7;

  categorias.forEach((categoria, c) => {
    const inicioGrupo =
      margem.esquerda + grupo * c + (grupo - larguraBarra * series.length) / 2;
    series.forEach((serie, s) => {
      const valor = serie.valores[c] ?? 0;
      const alturaBarra = (valor / maximo) * areaAltura;
      const x = inicioGrupo + s * larguraBarra;
      const y = margem.topo + areaAltura - alturaBarra;
      const cor = serie.cor ?? CORES_PADRAO[s % CORES_PADRAO.length];
      if (valor > 0) {
        conteudo += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(larguraBarra - 1.5).toFixed(1)}" height="${alturaBarra.toFixed(1)}" rx="1.5" fill="${cor}"/>`;
        if (formato === 'numero' || series.length === 1) {
          conteudo += texto(
            x + (larguraBarra - 1.5) / 2,
            y - 2.5,
            formato === 'moeda' ? formatarValor(valor, formato) : String(valor),
            { tamanho: 6, cor: PALETA.suave, ancora: 'middle' },
          );
        }
      }
    });
    conteudo += texto(
      margem.esquerda + grupo * c + grupo / 2,
      altura - 8,
      categoria,
      { tamanho: tamanhoRotulo, cor: PALETA.suave, ancora: 'middle' },
    );
  });

  return svg(largura, altura, conteudo);
}

export function graficoBarras(
  itens: { rotulo: string; valor: number; texto?: string }[],
  largura: number,
  formato: FormatoValor = 'numero',
  cor: string = PALETA.laranja,
): string {
  const linha = 22;
  const altura = itens.length * linha + 4;
  const rotuloLargura = Math.min(130, largura * 0.38);
  const valorLargura = formato === 'moeda' ? 64 : 40;
  const areaLargura = largura - rotuloLargura - valorLargura - 8;
  const maximo = Math.max(...itens.map((i) => i.valor), 0) || 1;
  let conteudo = '';

  itens.forEach((item, i) => {
    const y = i * linha + 4;
    const larguraBarra = Math.max((item.valor / maximo) * areaLargura, 2);
    conteudo += texto(0, y + 10, truncar(item.rotulo, 30), { tamanho: 7.5 });
    conteudo += `<rect x="${rotuloLargura}" y="${y + 2}" width="${areaLargura}" height="11" rx="3" fill="${PALETA.trilho}"/>`;
    conteudo += `<rect x="${rotuloLargura}" y="${y + 2}" width="${larguraBarra.toFixed(1)}" height="11" rx="3" fill="${cor}"/>`;
    conteudo += texto(
      largura - 2,
      y + 10,
      item.texto ?? formatarValor(item.valor, formato),
      { tamanho: 7.5, negrito: true, ancora: 'end' },
    );
  });

  return svg(largura, altura, conteudo);
}

export function graficoProgresso(
  itens: { rotulo: string; percentual: number; texto: string }[],
  largura: number,
  cor: string = PALETA.verde,
): string {
  const linha = 30;
  const altura = itens.length * linha + 2;
  let conteudo = '';

  itens.forEach((item, i) => {
    const y = i * linha;
    const percentual = Math.min(Math.max(item.percentual, 0), 1);
    conteudo += texto(0, y + 10, item.rotulo, { tamanho: 8 });
    conteudo += texto(largura - 2, y + 10, item.texto, {
      tamanho: 8,
      negrito: true,
      ancora: 'end',
    });
    conteudo += `<rect x="0" y="${y + 15}" width="${largura}" height="8" rx="4" fill="${PALETA.trilho}"/>`;
    if (percentual > 0) {
      conteudo += `<rect x="0" y="${y + 15}" width="${Math.max(largura * percentual, 8).toFixed(1)}" height="8" rx="4" fill="${cor}"/>`;
    }
  });

  return svg(largura, altura, conteudo);
}
