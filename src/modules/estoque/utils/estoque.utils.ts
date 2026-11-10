import { Prisma, TipoMovimentacaoEstoque } from '@prisma/client';

export interface ItemEstoqueNormalizado {
  descricaoItem: string;
  unidadeMedida: string;
  chaveAgrupamento: string;
}

export interface MovimentacaoParaCalculo {
  tipo: TipoMovimentacaoEstoque;
  quantidade: number | Prisma.Decimal;
}

/**
 * Normaliza a descrição e a unidade de medida para identificação consistente
 * de itens no estoque físico.
 */
export function normalizarItemEstoque(
  descricaoItem: string,
  unidadeMedida?: string | null,
): { descricaoItem: string; unidadeMedida: string } {
  // Remove espaços extras nas pontas e reduz múltiplos espaços internos
  const descricaoNormalizada = (descricaoItem || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 150);

  // Padroniza unidade de medida em letras maiúsculas, com fallback seguro para 'UN'
  const unidadeNormalizada = (unidadeMedida || 'UN')
    .trim()
    .toUpperCase()
    .slice(0, 20) || 'UN';

  return {
    descricaoItem: descricaoNormalizada,
    unidadeMedida: unidadeNormalizada,
  };
}

/**
 * Gera a chave única composta de identificação do item no estoque.
 */
export function gerarChaveItemEstoque(
  tipoItem: string,
  descricaoItem: string,
  unidadeMedida: string,
): string {
  const { descricaoItem: desc, unidadeMedida: un } = normalizarItemEstoque(
    descricaoItem,
    unidadeMedida,
  );
  return `${tipoItem}:::${desc.toLowerCase()}:::${un.toLowerCase()}`;
}

/**
 * Centraliza o cálculo exato de saldo utilizando Prisma.Decimal,
 * preservando a semântica de ENTRADA, SAIDA e AJUSTE.
 */
export function calcularSaldoDeMovimentacoes(
  movimentacoes: MovimentacaoParaCalculo[],
): Prisma.Decimal {
  let saldo = new Prisma.Decimal(0);

  for (const mov of movimentacoes) {
    const qtd =
      mov.quantidade instanceof Prisma.Decimal
        ? mov.quantidade
        : new Prisma.Decimal(mov.quantidade.toString());

    if (mov.tipo === TipoMovimentacaoEstoque.ENTRADA) {
      saldo = saldo.plus(qtd);
    } else if (mov.tipo === TipoMovimentacaoEstoque.SAIDA) {
      saldo = saldo.minus(qtd);
    } else if (mov.tipo === TipoMovimentacaoEstoque.AJUSTE) {
      saldo = qtd;
    }
  }

  return saldo;
}


