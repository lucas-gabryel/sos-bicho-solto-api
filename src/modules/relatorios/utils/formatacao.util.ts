import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  StatusAnimal,
  TipoDoacao,
} from '@prisma/client';

export const FUSO_HORARIO = 'America/Maceio';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const ESPECIE_LABEL: Record<EspecieAnimal, string> = {
  CAO: 'Cão',
  GATO: 'Gato',
};

export const STATUS_LABEL: Record<StatusAnimal, string> = {
  ACOLHIMENTO: 'Em acolhimento',
  ADOTADO: 'Adotado',
  TRANSFERIDO: 'Transferido',
  OBITO: 'Óbito',
};

export const MOTIVO_SAIDA_LABEL: Record<MotivoSaidaAnimal, string> = {
  ADOCAO: 'Adoção',
  TRANSFERENCIA: 'Transferência',
  OBITO: 'Óbito',
};

export const TIPO_DOACAO_LABEL: Record<TipoDoacao, string> = {
  DINHEIRO: 'Dinheiro',
  RACAO: 'Ração',
  MEDICAMENTO: 'Medicamento',
  PRODUTO_LIMPEZA: 'Produto de limpeza',
  OUTRO: 'Outro',
};

export function formatarData(data: Date | null | undefined): string {
  if (!data) return '-';
  return data.toLocaleDateString('pt-BR', { timeZone: FUSO_HORARIO });
}

export function formatarDataHora(data: Date): string {
  const hora = data.toLocaleTimeString('pt-BR', {
    timeZone: FUSO_HORARIO,
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatarData(data)} às ${hora}`;
}

export function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(
    0,
    Math.floor((fim.getTime() - inicio.getTime()) / UM_DIA_MS),
  );
}

export function plural(
  quantidade: number,
  singular: string,
  pluralForma: string,
): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralForma}`;
}

export function formatarDuracao(dias: number): string {
  if (dias < 1) return 'menos de 1 dia';
  if (dias < 60) return plural(dias, 'dia', 'dias');
  if (dias < 730) return plural(Math.floor(dias / 30), 'mês', 'meses');
  return plural(Math.floor(dias / 365), 'ano', 'anos');
}

export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}

export function formatarPercentual(parte: number, total: number): string {
  if (total === 0) return '-';
  return `${Math.round((parte / total) * 100)}%`;
}

export interface Periodo {
  de?: Date;
  ate?: Date;
}

export function noPeriodo(data: Date | null | undefined, periodo: Periodo) {
  if (!data) return false;
  if (periodo.de && data < periodo.de) return false;
  if (periodo.ate && data > periodo.ate) return false;
  return true;
}

export function descreverPeriodo(periodo: Periodo): string {
  if (periodo.de && periodo.ate) {
    return `${formatarData(periodo.de)} a ${formatarData(periodo.ate)}`;
  }
  if (periodo.de) return `A partir de ${formatarData(periodo.de)}`;
  if (periodo.ate) return `Até ${formatarData(periodo.ate)}`;
  return 'Todo o histórico';
}

// Abertura das frases do resumo ("Entre 01/11/2026 e 24/11/2026, ...").
export function introducaoPeriodo(periodo: Periodo): string {
  if (periodo.de && periodo.ate) {
    return `Entre ${formatarData(periodo.de)} e ${formatarData(periodo.ate)}`;
  }
  if (periodo.de) return `Desde ${formatarData(periodo.de)}`;
  if (periodo.ate) return `Até ${formatarData(periodo.ate)}`;
  return 'Em todo o histórico registrado';
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

// Maceió não tem horário de verão: o dia local começa às 03:00 UTC.
const DESLOCAMENTO_FUSO_HORAS = 3;

const MESES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export interface Intervalo {
  rotulo: string;
  inicio: Date;
  fim: Date;
}

function partesLocais(data: Date) {
  const local = new Date(data.getTime() - DESLOCAMENTO_FUSO_HORAS * 3600000);
  return { ano: local.getUTCFullYear(), mes: local.getUTCMonth() };
}

function inicioDoMes(ano: number, mes: number): Date {
  return new Date(Date.UTC(ano, mes, 1, DESLOCAMENTO_FUSO_HORAS));
}

// Divide o período em intervalos para os gráficos de evolução: semanas em
// períodos curtos, meses até ~15 meses e anos acima disso. Sem início
// informado, parte da data mais antiga dos dados.
export function intervalosDoPeriodo(
  periodo: Periodo,
  datas: Date[],
  agora: Date,
): Intervalo[] {
  const maisAntiga = datas.length
    ? new Date(Math.min(...datas.map((d) => d.getTime())))
    : agora;
  const inicio = periodo.de ?? maisAntiga;
  const fim = periodo.ate && periodo.ate < agora ? periodo.ate : agora;
  if (fim <= inicio) {
    return [{ rotulo: formatarData(inicio).slice(0, 5), inicio, fim: inicio }];
  }
  const dias = diasEntre(inicio, fim);
  const intervalos: Intervalo[] = [];

  if (dias <= 35) {
    for (let t = inicio.getTime(); t <= fim.getTime(); t += 7 * UM_DIA_MS) {
      const fimSemana = new Date(
        Math.min(t + 7 * UM_DIA_MS - 1, fim.getTime()),
      );
      intervalos.push({
        rotulo: formatarData(new Date(t)).slice(0, 5),
        inicio: new Date(t),
        fim: fimSemana,
      });
    }
    return intervalos;
  }

  const primeiro = partesLocais(inicio);
  const ultimo = partesLocais(fim);

  if (dias <= 460) {
    for (
      let ano = primeiro.ano, mes = primeiro.mes;
      ano < ultimo.ano || (ano === ultimo.ano && mes <= ultimo.mes);
      mes === 11 ? ((mes = 0), ano++) : mes++
    ) {
      intervalos.push({
        rotulo: `${MESES[mes]}/${String(ano).slice(2)}`,
        inicio: inicioDoMes(ano, mes),
        fim: new Date(inicioDoMes(ano, mes + 1).getTime() - 1),
      });
    }
    return intervalos;
  }

  for (let ano = primeiro.ano; ano <= ultimo.ano; ano++) {
    intervalos.push({
      rotulo: String(ano),
      inicio: inicioDoMes(ano, 0),
      fim: new Date(inicioDoMes(ano + 1, 0).getTime() - 1),
    });
  }
  return intervalos;
}

export function somarPorIntervalo(
  intervalos: Intervalo[],
  itens: { data: Date | null; valor?: number }[],
): number[] {
  return intervalos.map((intervalo) =>
    itens
      .filter(
        (item) =>
          item.data &&
          item.data >= intervalo.inicio &&
          item.data <= intervalo.fim,
      )
      .reduce((soma, item) => soma + (item.valor ?? 1), 0),
  );
}
