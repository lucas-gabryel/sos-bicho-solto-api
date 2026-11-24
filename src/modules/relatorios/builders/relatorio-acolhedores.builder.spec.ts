import { EspecieAnimal, StatusAnimal } from '@prisma/client';
import {
  AcolhedorRelatorio,
  AdocaoRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  montarRelatorioAdotantes,
  montarRelatorioTutores,
} from './relatorio-acolhedores.builder';

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
    observacoes: null,
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
    cpf: '390.533.447-05',
    telefone: '(82) 99912-3456',
    email: 'contato@email.com',
    endereco: 'Rua A, 10 - Centro, Arapiraca/AL',
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

describe('montarRelatorioTutores', () => {
  const ana = acolhedor({
    codigo: 1,
    nome: 'Ana Clara',
    criadoEm: new Date('2026-10-01T12:00Z'),
    adocoes: [
      adocao(MIA, { codigo: 1, nome: 'Ana Clara' }, '2026-11-15T12:00Z'),
    ],
    animaisVinculados: [{ ...MIA, raca: 'SRD', status: StatusAnimal.ADOTADO }],
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
    animaisVinculados: [
      { ...TOBY, raca: 'Labrador', status: StatusAnimal.ADOTADO },
    ],
  });
  const valor = (
    doc: ReturnType<typeof montarRelatorioTutores>,
    rotulo: string,
  ) => doc.indicadores.find((i) => i.rotulo === rotulo)?.valor;

  it('resume a situação atual e as movimentações do período', () => {
    const doc = montarRelatorioTutores([ana, carlos], NOVEMBRO, META);

    expect(valor(doc, 'Tutores ativos')).toBe('2');
    expect(valor(doc, 'Animais sob guarda')).toBe('2');
    expect(valor(doc, 'Novos tutores')).toBe('1');
    expect(valor(doc, 'Adoções no período')).toBe('1');
    expect(valor(doc, 'Devoluções no período')).toBe('1');
    expect(valor(doc, 'Guardas com mais de 1 ano')).toBe('1');
    expect(doc.resumo[0]).toContain(
      'a ONG conta com 2 tutores ativos, responsáveis por 2 animais resgatados (1 cão e 1 gato)',
    );
    expect(doc.resumo[1]).toBe(
      'Entre 01/11/2026 e 30/11/2026, 1 pessoa se tornou tutora pela primeira vez e os tutores atuais realizaram 1 adoção, com 1 devolução registrada.',
    );
  });

  it('lista os animais sob guarda pela data de adoção', () => {
    const doc = montarRelatorioTutores([ana, carlos], NOVEMBRO, META);
    const linhas = doc.secoes[0].tabelas[0].linhas;

    expect(linhas.map((l) => l[1])).toEqual(['Toby', 'Mia']);
    expect(linhas[1][4]).toBe('Ana Clara (#1)');
    expect(linhas[1][5]).toBe('15/11/2026');
  });

  it('descreve cada tutor na ficha com CPF mascarado', () => {
    const doc = montarRelatorioTutores([ana, carlos], NOVEMBRO, META);
    const fichaCarlos = doc.fichas.itens.find((f) =>
      f.titulo.startsWith('Carlos'),
    );

    expect(fichaCarlos?.paragrafos[0]).toContain(
      'Responsável atualmente por 1 animal: Toby (cão, sob guarda desde 01/02/2025',
    );
    expect(fichaCarlos?.paragrafos[0]).toContain(
      'No total, realizou 2 adoções pela ONG, das quais 1 foi devolvida.',
    );
    expect(fichaCarlos?.paragrafos[1]).toContain('CPF ***.533.447-**');
    expect(fichaCarlos?.paragrafos[1]).not.toContain('390.533.447-05');
    expect(fichaCarlos?.tabelas[0].linhas[0][2]).toBe('Vigente');
  });

  it('inclui nas fichas só tutores com movimentação no período', () => {
    const outubro = {
      de: new Date('2026-10-01T03:00:00Z'),
      ate: new Date('2026-11-01T02:59:59Z'),
    };
    const doc = montarRelatorioTutores([ana, carlos], outubro, META);

    expect(doc.fichas.itens.map((f) => f.titulo)).toEqual([
      'Ana Clara · Cadastro #1',
    ]);
  });
});

describe('montarRelatorioAdotantes', () => {
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
  const ADOTANTES = [beatriz, diego, eva];
  const valor = (
    doc: ReturnType<typeof montarRelatorioAdotantes>,
    rotulo: string,
  ) => doc.indicadores.find((i) => i.rotulo === rotulo)?.valor;

  it('calcula espera, novos cadastros e histórico de devoluções', () => {
    const doc = montarRelatorioAdotantes(ADOTANTES, NOVEMBRO, META);

    expect(valor(doc, 'Adotantes cadastrados')).toBe('3');
    expect(valor(doc, 'Novos cadastros')).toBe('2');
    expect(valor(doc, 'Aguardando 1ª adoção')).toBe('2');
    expect(valor(doc, 'Com devolução no histórico')).toBe('1');
    expect(valor(doc, 'Devoluções no período')).toBe('1');
    expect(valor(doc, 'Espera acima de 90 dias')).toBe('1');
    expect(doc.resumo[0]).toContain(
      '1 cadastro já adotou e devolveu animais à ONG.',
    );
    expect(doc.resumo[2]).toContain(
      'Recomenda-se avaliar o histórico de devoluções',
    );
  });

  it('destaca os adotantes com devolução e a fila de espera', () => {
    const doc = montarRelatorioAdotantes(ADOTANTES, NOVEMBRO, META);
    const [devolucoes, aguardando] = doc.secoes;

    expect(devolucoes.tabelas[0].linhas).toEqual([
      ['#4', 'Diego Alves', '1', '1', '18/11/2026', 'Alergia na família'],
    ]);
    expect(aguardando.tabelas[0].linhas.map((l) => l[1])).toEqual([
      'Beatriz Souza',
      'Eva Martins',
    ]);
  });

  it('inclui nas fichas só adotantes com cadastro ou devolução no período', () => {
    const doc = montarRelatorioAdotantes(ADOTANTES, NOVEMBRO, META);

    expect(doc.fichas.itens.map((f) => f.titulo)).toEqual([
      'Diego Alves · Cadastro #4',
      'Eva Martins · Cadastro #5',
    ]);
    expect(doc.fichas.itens[1].paragrafos[0]).toContain(
      'Ainda não realizou adoções pela ONG.',
    );
    expect(doc.fichas.itens[1].tabelas).toEqual([]);
  });
});
