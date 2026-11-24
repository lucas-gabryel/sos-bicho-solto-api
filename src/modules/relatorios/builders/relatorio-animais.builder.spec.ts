import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import {
  AdocaoRelatorio,
  AnimalRelatorio,
  EventoRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  inicioDoAcolhimento,
  montarRelatorioAnimais,
} from './relatorio-animais.builder';

const AGORA = new Date('2026-11-24T15:00:00Z');
const NOVEMBRO = {
  de: new Date('2026-11-01T03:00:00Z'),
  ate: new Date('2026-12-01T02:59:59Z'),
};
const META = { geradoEm: AGORA, geradoPor: 'Malba Vinicius' };

function evento(
  data: string,
  tipo: TipoEventoAnimal,
  descricao: string,
  motivoSaida: MotivoSaidaAnimal | null = null,
): EventoRelatorio {
  return {
    dataEvento: new Date(data),
    tipo,
    motivoSaida,
    descricao,
    automatico: true,
    registradoPor: 'Paula Freitas',
  };
}

function adocao(
  animal: Pick<AnimalRelatorio, 'nome' | 'numeroRegistro' | 'especie'> & {
    criadoEm: string;
    entradas: string[];
  },
  tutor: { codigo: number; nome: string },
  dataAdocao: string,
  devolvidoEm: string | null = null,
): AdocaoRelatorio {
  return {
    dataAdocao: new Date(dataAdocao),
    devolvidoEm: devolvidoEm ? new Date(devolvidoEm) : null,
    observacoes: null,
    observacoesDevolucao: devolvidoEm ? 'Mudança de cidade' : null,
    protetor: 'Paula Freitas',
    tutor,
    animal: {
      nome: animal.nome,
      numeroRegistro: animal.numeroRegistro,
      especie: animal.especie,
      criadoEm: new Date(animal.criadoEm),
      entradas: animal.entradas.map((d) => new Date(d)),
    },
  };
}

function animal(dados: Partial<AnimalRelatorio>): AnimalRelatorio {
  return {
    numeroRegistro: '01.01.2026.1',
    nome: 'Animal',
    especie: EspecieAnimal.CAO,
    raca: 'SRD',
    sexo: SexoAnimal.MACHO,
    porte: null,
    cor: 'Caramelo',
    pesoInicial: 7.2,
    pesoAtual: null,
    dataNascimento: null,
    castrado: false,
    vacinado: false,
    localResgate: 'Centro, Arapiraca/AL',
    observacoes: null,
    status: StatusAnimal.ACOLHIMENTO,
    criadoEm: new Date('2026-01-01T12:00Z'),
    tutor: null,
    eventos: [],
    adocoes: [],
    ...dados,
  };
}

const ANA = { codigo: 1, nome: 'Ana Clara' };
const CARLOS = { codigo: 2, nome: 'Carlos Lima' };

// Rex: acolhido desde junho, sem adoções, com registro médico em novembro.
const rex = animal({
  numeroRegistro: '01.06.2026.1',
  nome: 'Rex',
  castrado: true,
  vacinado: true,
  pesoAtual: 8.1,
  criadoEm: new Date('2026-06-01T12:00Z'),
  eventos: [
    evento('2026-06-01T12:00Z', TipoEventoAnimal.ENTRADA, 'Entrada na ONG'),
    evento('2026-11-10T12:00Z', TipoEventoAnimal.MEDICO, 'Vacina V10'),
  ],
});

// Mia: resgatada em novembro e adotada 10 dias depois.
const miaBase = {
  nome: 'Mia',
  numeroRegistro: '05.11.2026.1',
  especie: EspecieAnimal.GATO,
  criadoEm: '2026-11-05T12:00Z',
  entradas: ['2026-11-05T12:00Z'],
};
const mia = animal({
  ...miaBase,
  sexo: SexoAnimal.FEMEA,
  criadoEm: new Date(miaBase.criadoEm),
  status: StatusAnimal.ADOTADO,
  tutor: ANA,
  eventos: [
    evento('2026-11-05T12:00Z', TipoEventoAnimal.ENTRADA, 'Entrada na ONG'),
    evento(
      '2026-11-15T12:00Z',
      TipoEventoAnimal.SAIDA,
      'Saída por adoção',
      MotivoSaidaAnimal.ADOCAO,
    ),
  ],
  adocoes: [adocao(miaBase, ANA, '2026-11-15T12:00Z')],
});

// Bob: adotado em abril e devolvido em novembro.
const bobBase = {
  nome: 'Bob',
  numeroRegistro: '01.03.2026.1',
  especie: EspecieAnimal.CAO,
  criadoEm: '2026-03-01T12:00Z',
  entradas: ['2026-03-01T12:00Z', '2026-11-20T12:00Z'],
};
const bob = animal({
  ...bobBase,
  criadoEm: new Date(bobBase.criadoEm),
  eventos: [
    evento('2026-03-01T12:00Z', TipoEventoAnimal.ENTRADA, 'Entrada na ONG'),
    evento(
      '2026-04-01T12:00Z',
      TipoEventoAnimal.SAIDA,
      'Saída por adoção',
      MotivoSaidaAnimal.ADOCAO,
    ),
    evento('2026-11-20T12:00Z', TipoEventoAnimal.ENTRADA, 'Retorno'),
  ],
  adocoes: [adocao(bobBase, CARLOS, '2026-04-01T12:00Z', '2026-11-20T12:00Z')],
});

// Luna: óbito em fevereiro, sem movimentação em novembro.
const luna = animal({
  nome: 'Luna',
  numeroRegistro: '10.01.2026.1',
  especie: EspecieAnimal.GATO,
  sexo: SexoAnimal.FEMEA,
  status: StatusAnimal.OBITO,
  criadoEm: new Date('2026-01-10T12:00Z'),
  eventos: [
    evento('2026-01-10T12:00Z', TipoEventoAnimal.ENTRADA, 'Entrada na ONG'),
    evento(
      '2026-02-01T12:00Z',
      TipoEventoAnimal.SAIDA,
      'Saída por óbito',
      MotivoSaidaAnimal.OBITO,
    ),
  ],
});

const ANIMAIS = [rex, mia, bob, luna];

function indicador(
  doc: ReturnType<typeof montarRelatorioAnimais>,
  rotulo: string,
) {
  return doc.indicadores.find((i) => i.rotulo === rotulo);
}

describe('montarRelatorioAnimais', () => {
  it('usa a última entrada antes da referência como início do acolhimento', () => {
    const entradas = [
      new Date('2026-03-01T12:00Z'),
      new Date('2026-11-20T12:00Z'),
    ];
    const criadoEm = new Date('2026-03-01T12:00Z');

    expect(
      inicioDoAcolhimento(entradas, criadoEm, new Date('2026-04-01T12:00Z')),
    ).toEqual(new Date('2026-03-01T12:00Z'));
    expect(inicioDoAcolhimento(entradas, criadoEm, AGORA)).toEqual(
      new Date('2026-11-20T12:00Z'),
    );
    expect(inicioDoAcolhimento([], criadoEm, AGORA)).toEqual(criadoEm);
  });

  it('calcula as movimentações do período e a situação atual', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, NOVEMBRO, META);

    expect(indicador(doc, 'Entradas no período')).toEqual({
      rotulo: 'Entradas no período',
      valor: '1',
      detalhe: '0 cães e 1 gato',
    });
    expect(indicador(doc, 'Adoções no período')?.valor).toBe('1');
    expect(indicador(doc, 'Adoções no período')?.detalhe).toBe(
      'média de 10 dias até a adoção',
    );
    expect(indicador(doc, 'Devoluções no período')?.valor).toBe('1');
    expect(indicador(doc, 'Transferências / óbitos')?.valor).toBe('0 / 0');
    expect(indicador(doc, 'Em acolhimento hoje')?.valor).toBe('2');
    expect(indicador(doc, 'Castrados / vacinados')?.valor).toBe('50% / 50%');
    expect(indicador(doc, 'Registros de saúde')?.valor).toBe('1');
  });

  it('gera um resumo descritivo para prestação de contas', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, NOVEMBRO, META);

    expect(doc.resumo[0]).toContain(
      'Entre 01/11/2026 e 30/11/2026, a ONG registrou 1 entrada de animais resgatados (0 cães e 1 gato) e concluiu 1 adoção.',
    );
    expect(doc.resumo[0]).toContain(
      'Houve 1 devolução (equivalente a 100% das adoções do mesmo período).',
    );
    expect(doc.resumo[1]).toContain('mantém 2 animais em acolhimento');
    expect(doc.resumo[1]).toContain(
      '1 animal está há mais de 90 dias aguardando adoção',
    );
    expect(doc.resumo[2]).toContain('em média, 10 dias sob cuidados da ONG');
  });

  it('lista animais de longa permanência pelo início do acolhimento vigente', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, NOVEMBRO, META);
    const longa = doc.secoes.find((s) => s.titulo.startsWith('Animais há'));

    // Bob voltou em 20/11 e não conta como longa permanência.
    expect(longa?.tabelas[0].linhas.map((l) => l[1])).toEqual(['Rex']);
  });

  it('inclui nas fichas apenas animais com movimentação no período', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, NOVEMBRO, META);

    expect(doc.fichas.itens.map((f) => f.titulo)).toEqual([
      'Bob · Registro 01.03.2026.1',
      'Mia · Registro 05.11.2026.1',
      'Rex · Registro 01.06.2026.1',
    ]);
  });

  it('descreve a trajetória de cada animal na ficha', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, NOVEMBRO, META);
    const fichaMia = doc.fichas.itens.find((f) => f.titulo.startsWith('Mia'));
    const fichaBob = doc.fichas.itens.find((f) => f.titulo.startsWith('Bob'));
    const fichaRex = doc.fichas.itens.find((f) => f.titulo.startsWith('Rex'));

    expect(fichaMia?.paragrafos[0]).toContain(
      'Adotada em 15/11/2026 por Ana Clara (cadastro #1), após 10 dias em acolhimento',
    );
    expect(fichaBob?.paragrafos[0]).toContain(
      'Encontra-se em acolhimento há 4 dias (desde 20/11/2026).',
    );
    expect(fichaBob?.paragrafos[2]).toBe(
      'Histórico: 1 adoção, 1 devolução e 0 registros de saúde.',
    );
    expect(fichaRex?.paragrafos[1]).toBe(
      'Castrado: sim. Vacinado: sim. Peso inicial de 7,2 kg; peso atual de 8,1 kg (variação de +0,9 kg).',
    );
    expect(fichaRex?.tabelas[0].linhas).toHaveLength(2);
  });

  it('aplica o filtro de situação somente às fichas', () => {
    const doc = montarRelatorioAnimais(
      ANIMAIS,
      { ...NOVEMBRO, status: StatusAnimal.ADOTADO },
      META,
    );

    expect(doc.fichas.itens.map((f) => f.titulo)).toEqual([
      'Mia · Registro 05.11.2026.1',
    ]);
    expect(indicador(doc, 'Em acolhimento hoje')?.valor).toBe('2');
  });

  it('considera todo o histórico quando não há período', () => {
    const doc = montarRelatorioAnimais(ANIMAIS, {}, META);

    expect(doc.filtros[0]).toEqual({
      rotulo: 'Período',
      valor: 'Todo o histórico',
    });
    expect(indicador(doc, 'Entradas no período')?.valor).toBe('4');
    expect(indicador(doc, 'Transferências / óbitos')?.valor).toBe('0 / 1');
    expect(doc.fichas.itens).toHaveLength(4);
    expect(
      doc.fichas.itens.find((f) => f.titulo.startsWith('Luna'))?.paragrafos[0],
    ).toContain('Teve óbito registrado em 01/02/2026.');
  });

  it('ordena as movimentações do período cronologicamente', () => {
    const zecaBase = {
      nome: 'Zeca',
      numeroRegistro: '02.02.2026.1',
      especie: EspecieAnimal.CAO,
      criadoEm: '2026-02-02T12:00Z',
      entradas: ['2026-02-02T12:00Z'],
    };
    // Zeca vem depois de Bob na lista, mas foi devolvido antes.
    const zeca = animal({
      ...zecaBase,
      criadoEm: new Date(zecaBase.criadoEm),
      adocoes: [
        adocao(zecaBase, ANA, '2026-11-02T12:00Z', '2026-11-18T12:00Z'),
      ],
    });
    const doc = montarRelatorioAnimais([bob, zeca], NOVEMBRO, META);
    const devolucoes = doc.secoes[1].tabelas.find(
      (t) => t.titulo === 'Devoluções',
    );

    expect(devolucoes?.linhas.map((l) => l[0])).toEqual([
      '18/11/2026',
      '20/11/2026',
    ]);
  });

  it('produz um relatório coerente sem nenhum animal', () => {
    const doc = montarRelatorioAnimais([], NOVEMBRO, META);

    expect(doc.resumo[1]).toBe(
      'Na data de emissão, não há animais em acolhimento na ONG.',
    );
    expect(doc.fichas.itens).toEqual([]);
  });
});
