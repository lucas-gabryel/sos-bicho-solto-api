import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  PorteAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';

export const FUSO_HORARIO = 'America/Maceio';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const ESPECIE_LABEL: Record<EspecieAnimal, string> = {
  CAO: 'Cão',
  GATO: 'Gato',
};

export const SEXO_LABEL: Record<SexoAnimal, string> = {
  MACHO: 'Macho',
  FEMEA: 'Fêmea',
};

export const PORTE_LABEL: Record<PorteAnimal, string> = {
  PEQUENO: 'pequeno',
  MEDIO: 'médio',
  GRANDE: 'grande',
};

export const STATUS_LABEL: Record<StatusAnimal, string> = {
  ACOLHIMENTO: 'Em acolhimento',
  ADOTADO: 'Adotado',
  TRANSFERIDO: 'Transferido',
  OBITO: 'Óbito',
};

export const TIPO_EVENTO_LABEL: Record<TipoEventoAnimal, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  MEDICO: 'Saúde',
  FOTO: 'Foto',
  OUTRO: 'Outro',
};

export const MOTIVO_SAIDA_LABEL: Record<MotivoSaidaAnimal, string> = {
  ADOCAO: 'Adoção',
  TRANSFERENCIA: 'Transferência',
  OBITO: 'Óbito',
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

export function formatarPeso(peso: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(peso)} kg`;
}

// Relatórios circulam fora do sistema (prestação de contas), então o CPF sai
// mascarado, preservando só os dígitos centrais para conferência.
export function mascararCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '');
  if (digitos.length !== 11) return '***';
  return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
}

export function juntarLista(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
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

export function temPeriodo(periodo: Periodo): boolean {
  return Boolean(periodo.de || periodo.ate);
}
