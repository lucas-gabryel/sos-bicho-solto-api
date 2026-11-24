import { EspecieAnimal, StatusAnimal } from '@prisma/client';
import {
  AcolhedorRelatorio,
  AdocaoRelatorio,
} from '../repositories/relatorios.repository.interface';
import { montarRelatorioAcolhedores } from './relatorio-acolhedores.builder';

const AGORA = new Date('2026-11-24T15:00:00Z');
const NOVEMBRO = {
  de: new Date('2026-11-01T03:00:00Z'),
  ate: new Date('2026-12-01T02:59:59Z'),
};
const META = { geradoEm: AGORA, geradoPor: 'Malba Vinicius' };

function adocao(
  animal: { nome: string; numeroRegistro: string; especie: EspecieAnimal },
  tutor: { codigo: number; nome: string },
  dataAdocao: string,
  devolvidoEm: string | null = null,
  observacoesDevolucao: string | null = null,
): AdocaoRelatorio {
  return {
    dataAdocao: new Date(dataAdocao),
    devolvidoEm: devolvidoEm ? new Date(devolvidoEm) : null,
    observacoesDevolucao,
    protetor: 'Paula Freitas',
    tutor,
    animal: {
      ...animal,
      criadoEm: new Date('2025-01-01T12:00Z'),
      entradas: [],
    },
  };
}

function acolhedor(dados: Partial<AcolhedorRelatorio>): AcolhedorRelatorio {
  return {
    codigo: 1,
    nome: 'Acolhedor',
    telefone: '(82) 99912-3456',
    criadoEm: new Date('2026-01-01T12:00Z'),
    adocoes: [],
    animaisVinculados: [],
    ...dados,
  };
}

const MIA = {
  nome: 'Mia',
  numeroRegistro: '05.11.2026.1',
  especie: EspecieAnimal.GATO,
};
const TOBY = {
  nome: 'Toby',
  numeroRegistro: '01.01.2025.1',
  especie: EspecieAnimal.CAO,
};
const BOB = {
  nome: 'Bob',
  numeroRegistro: '01.03.2026.1',
  especie: EspecieAnimal.CAO,
};
const REX = {
  nome: 'Rex',
  numeroRegistro: '01.06.2026.1',
  especie: EspecieAnimal.CAO,
};

// Tutores: Ana (adotou em novembro) e Carlos (guarda desde 2025 e uma
// devolução em novembro).
const ana = acolhedor({
  codigo: 1,
  nome: 'Ana Clara',
  criadoEm: new Date('2026-10-01T12:00Z'),
  adocoes: [adocao(MIA, { codigo: 1, nome: 'Ana Clara' }, '2026-11-15T12:00Z')],
  animaisVinculados: [{ ...MIA, status: StatusAnimal.ADOTADO }],
});
const carlos = acolhedor({
  codigo: 2,
  nome: 'Carlos Lima',
  criadoEm: new Date('2025-01-01T12:00Z'),
  adocoes: [
    adocao(TOBY, { codigo: 2, nome: 'Carlos Lima' }, '2025-02-01T12:00Z'),
    adocao(
      BOB,
      { codigo: 2, nome: 'Carlos Lima' },
      '2026-04-01T12:00Z',
      '2026-11-20T12:00Z',
    ),
  ],
  animaisVinculados: [{ ...TOBY, status: StatusAnimal.ADOTADO }],
});
// Adotantes: Beatriz (espera longa), Diego (devolveu o Rex) e Eva (nova).
const beatriz = acolhedor({
  codigo: 3,
  nome: 'Beatriz Souza',
  criadoEm: new Date('2026-07-01T12:00Z'),
});
const diego = acolhedor({
  codigo: 4,
  nome: 'Diego Alves',
  criadoEm: new Date('2026-11-10T12:00Z'),
  adocoes: [
    adocao(
      REX,
      { codigo: 4, nome: 'Diego Alves' },
      '2026-11-12T12:00Z',
      '2026-11-18T12:00Z',
      'Alergia na família',
    ),
  ],
});
const eva = acolhedor({
  codigo: 5,
  nome: 'Eva Martins',
  criadoEm: new Date('2026-11-20T12:00Z'),
});
const ACOLHEDORES = [ana, beatriz, carlos, diego, eva];

type Documento = ReturnType<typeof montarRelatorioAcolhedores>;

const valor = (doc: Documento, rotulo: string) =>
  doc.indicadores.find((i) => i.rotulo === rotulo)?.valor;

function secao(doc: Documento, titulo: string) {
  const encontrada = doc.secoes.find((s) => s.titulo === titulo);
  if (!encontrada) throw new Error(`Seção não encontrada: ${titulo}`);
  return encontrada;
}

describe('montarRelatorioAcolhedores', () => {
  it('classifica tutores e adotantes pela regra de animal vinculado', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);
    const [perfil] = secao(doc, 'Perfil dos acolhedores').graficos ?? [];

    expect(doc.indicadores[0]).toEqual({
      rotulo: 'Acolhedores cadastrados',
      valor: '5',
      detalhe: '2 tutores · 3 adotantes',
    });
    expect(perfil).toMatchObject({
      tipo: 'rosca',
      fatias: [
        { rotulo: 'Tutores', valor: 2 },
        { rotulo: 'Aguardando 1ª adoção', valor: 2 },
        { rotulo: 'Adotantes c/ devolução', valor: 1 },
      ],
    });
  });

  it('calcula indicadores da situação atual e do período', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);

    expect(valor(doc, 'Animais sob guarda')).toBe('2');
    expect(valor(doc, 'Novos cadastros')).toBe('2');
    expect(valor(doc, 'Novos tutores')).toBe('1');
    expect(valor(doc, 'Adoções no período')).toBe('2');
    expect(valor(doc, 'Devoluções no período')).toBe('2');
    expect(valor(doc, 'Espera média')).toBe('2 meses');
  });

  it('descreve tutores, período e pontos de atenção no resumo', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);

    expect(doc.resumo[0]).toContain(
      'a ONG conta com 5 acolhedores cadastrados: 2 tutores, responsáveis por 2 animais resgatados (1 cão e 1 gato), e 3 adotantes sem animal vinculado.',
    );
    expect(doc.resumo[1]).toBe(
      'Entre 01/11/2026 e 30/11/2026, foram realizados 2 novos cadastros, 1 pessoa se tornou tutora pela primeira vez, e foram registradas 2 adoções e 2 devoluções.',
    );
    expect(doc.resumo[2]).toContain('2 adotantes aguardam a primeira adoção');
    expect(doc.resumo[2]).toContain('1 adotante já devolveu animais à ONG');
  });

  it('distribui as guardas vigentes por faixa de tempo', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);
    const [, faixas] = secao(doc, 'Perfil dos acolhedores').graficos ?? [];

    expect(faixas).toMatchObject({
      tipo: 'barras',
      itens: [
        { rotulo: 'Até 3 meses', valor: 1 },
        { rotulo: 'De 3 a 6 meses', valor: 0 },
        { rotulo: 'De 6 meses a 1 ano', valor: 0 },
        { rotulo: 'Mais de 1 ano', valor: 1 },
      ],
    });
  });

  it('lista os animais sob guarda pela data de adoção', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);
    const [tabela] = secao(doc, 'Animais sob guarda').tabelas ?? [];

    expect(tabela.linhas.map((l) => [l[1], l[4], l[5]])).toEqual([
      ['Toby', 'Carlos Lima (#2)', '01/02/2025'],
      ['Mia', 'Ana Clara (#1)', '15/11/2026'],
    ]);
  });

  it('destaca devoluções e a fila de espera nos pontos de atenção', () => {
    const doc = montarRelatorioAcolhedores(ACOLHEDORES, NOVEMBRO, META);
    const [devolucoes, aguardando] =
      secao(doc, 'Pontos de atenção').tabelas ?? [];

    expect(devolucoes.linhas).toEqual([
      ['#4', 'Diego Alves', '1', '1', '18/11/2026', 'Alergia na família'],
    ]);
    expect(aguardando.linhas.map((l) => l[1])).toEqual([
      'Beatriz Souza',
      'Eva Martins',
    ]);
  });

  it('produz um relatório coerente sem cadastros', () => {
    const doc = montarRelatorioAcolhedores([], {}, META);

    expect(doc.periodo).toBe('Todo o histórico');
    expect(doc.resumo[0]).toBe(
      'Na data de emissão, não há acolhedores cadastrados.',
    );
    expect(valor(doc, 'Tempo médio de guarda')).toBe('-');
  });
});
