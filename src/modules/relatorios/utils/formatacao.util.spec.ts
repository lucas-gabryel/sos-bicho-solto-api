import {
  descreverPeriodo,
  diasEntre,
  formatarData,
  formatarDuracao,
  formatarPercentual,
  intervalosDoPeriodo,
  noPeriodo,
  somarPorIntervalo,
} from './formatacao.util';

describe('formatacao.util', () => {
  it('formata datas no fuso da ONG (America/Maceio)', () => {
    // 01:00 UTC ainda é o dia anterior em Maceió (UTC-3)
    expect(formatarData(new Date('2026-11-02T01:00:00Z'))).toBe('01/11/2026');
    expect(formatarData(null)).toBe('-');
  });

  it('calcula dias inteiros sem retornar valores negativos', () => {
    expect(
      diasEntre(new Date('2026-11-01T12:00Z'), new Date('2026-11-11T11:00Z')),
    ).toBe(9);
    expect(
      diasEntre(new Date('2026-11-11T12:00Z'), new Date('2026-11-01T12:00Z')),
    ).toBe(0);
  });

  it.each([
    [0, 'menos de 1 dia'],
    [1, '1 dia'],
    [45, '45 dias'],
    [90, '3 meses'],
    [400, '13 meses'],
    [800, '2 anos'],
  ])('descreve %i dias como "%s"', (dias, esperado) => {
    expect(formatarDuracao(dias)).toBe(esperado);
  });

  it('calcula percentual evitando divisão por zero', () => {
    expect(formatarPercentual(1, 3)).toBe('33%');
    expect(formatarPercentual(0, 0)).toBe('-');
  });

  it('verifica se a data está no período (limites inclusivos)', () => {
    const periodo = {
      de: new Date('2026-11-01T00:00Z'),
      ate: new Date('2026-11-30T23:59Z'),
    };
    expect(noPeriodo(new Date('2026-11-01T00:00Z'), periodo)).toBe(true);
    expect(noPeriodo(new Date('2026-12-01T00:00Z'), periodo)).toBe(false);
    expect(noPeriodo(null, periodo)).toBe(false);
    expect(noPeriodo(new Date('2020-01-01T00:00Z'), {})).toBe(true);
  });

  it('descreve o período aplicado', () => {
    expect(descreverPeriodo({})).toBe('Todo o histórico');
    expect(
      descreverPeriodo({
        de: new Date('2026-11-01T12:00Z'),
        ate: new Date('2026-11-24T12:00Z'),
      }),
    ).toBe('01/11/2026 a 24/11/2026');
  });

  describe('intervalosDoPeriodo', () => {
    const agora = new Date('2026-11-24T15:00:00Z');

    it('usa semanas em períodos de até um mês, sem passar da data de emissão', () => {
      const intervalos = intervalosDoPeriodo(
        {
          de: new Date('2026-11-01T03:00:00Z'),
          ate: new Date('2026-12-01T02:59:59Z'),
        },
        [],
        agora,
      );

      expect(intervalos.map((i) => i.rotulo)).toEqual([
        '01/11',
        '08/11',
        '15/11',
        '22/11',
      ]);
      expect(intervalos.at(-1)?.fim).toEqual(agora);
    });

    it('usa meses locais em períodos de até ~15 meses', () => {
      const intervalos = intervalosDoPeriodo(
        {
          de: new Date('2026-01-01T03:00:00Z'),
          ate: new Date('2026-12-01T02:59:59Z'),
        },
        [],
        agora,
      );

      expect(intervalos).toHaveLength(11);
      expect(intervalos[0]).toEqual({
        rotulo: 'jan/26',
        inicio: new Date('2026-01-01T03:00:00Z'),
        fim: new Date('2026-02-01T02:59:59.999Z'),
      });
      expect(intervalos.at(-1)?.rotulo).toBe('nov/26');
    });

    it('usa anos em períodos longos e parte do dado mais antigo sem início', () => {
      const intervalos = intervalosDoPeriodo(
        {},
        [new Date('2023-05-10T12:00:00Z')],
        agora,
      );

      expect(intervalos.map((i) => i.rotulo)).toEqual([
        '2023',
        '2024',
        '2025',
        '2026',
      ]);
    });
  });

  it('soma valores (ou conta itens) por intervalo', () => {
    const intervalos = intervalosDoPeriodo(
      {
        de: new Date('2026-11-01T03:00:00Z'),
        ate: new Date('2026-11-14T02:59:59Z'),
      },
      [],
      new Date('2026-11-24T15:00:00Z'),
    );

    expect(
      somarPorIntervalo(intervalos, [
        { data: new Date('2026-11-02T12:00Z') },
        { data: new Date('2026-11-09T12:00Z') },
        { data: null },
      ]),
    ).toEqual([1, 1]);
    expect(
      somarPorIntervalo(intervalos, [
        { data: new Date('2026-11-02T12:00Z'), valor: 150 },
        { data: new Date('2026-11-03T12:00Z'), valor: 50.5 },
      ]),
    ).toEqual([200.5, 0]);
  });
});
