import {
  descreverPeriodo,
  diasEntre,
  formatarData,
  formatarDuracao,
  formatarPercentual,
  juntarLista,
  mascararCpf,
  noPeriodo,
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

  it('mascara o CPF mantendo apenas os dígitos centrais', () => {
    expect(mascararCpf('390.533.447-05')).toBe('***.533.447-**');
    expect(mascararCpf('39053344705')).toBe('***.533.447-**');
    expect(mascararCpf('123')).toBe('***');
  });

  it('calcula percentual evitando divisão por zero', () => {
    expect(formatarPercentual(1, 3)).toBe('33%');
    expect(formatarPercentual(0, 0)).toBe('-');
  });

  it('junta listas em português', () => {
    expect(juntarLista(['Rex'])).toBe('Rex');
    expect(juntarLista(['Rex', 'Mia', 'Bob'])).toBe('Rex, Mia e Bob');
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
});
