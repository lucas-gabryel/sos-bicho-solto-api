import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import {
  calcularSaldoDeMovimentacoes,
  gerarChaveItemEstoque,
  normalizarItemEstoque,
} from '#src/modules/estoque/utils/estoque.utils';
import { DocumentoRelatorio } from '../pdf/documento-relatorio';
import { PALETA } from '../pdf/graficos';
import {
  DoacaoRelatorio,
  MovimentacaoEstoqueRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  Periodo,
  TIPO_DOACAO_LABEL,
  descreverPeriodo,
  formatarMoeda,
  introducaoPeriodo,
  intervalosDoPeriodo,
  noPeriodo,
  plural,
  somarPorIntervalo,
} from '../utils/formatacao.util';
import { MetadadosRelatorio } from './relatorio-animais.builder';

const COR_TIPO: Record<TipoDoacao, string> = {
  DINHEIRO: PALETA.verde,
  RACAO: PALETA.laranja,
  MEDICAMENTO: PALETA.azul,
  PRODUTO_LIMPEZA: PALETA.teal,
  OUTRO: PALETA.cinza,
};

const LIMITE_DOADORES = 10;

function formatarQuantidade(quantidade: number, unidade: string): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(quantidade)} ${unidade}`;
}

interface ResumoDoador {
  nome: string;
  doacoes: number;
  dinheiro: number;
  itens: number;
}

interface ItemEstoque {
  tipoItem: TipoDoacao;
  descricao: string;
  unidade: string;
  movimentacoes: MovimentacaoEstoqueRelatorio[];
}

// Agrupa as movimentações pela mesma chave do módulo de estoque (tipo +
// descrição + unidade, sem diferenciar maiúsculas) para o saldo bater com a
// tela de estoque.
function agruparEstoque(movimentacoes: MovimentacaoEstoqueRelatorio[]) {
  const itens = new Map<string, ItemEstoque>();
  for (const mov of movimentacoes) {
    const chave = gerarChaveItemEstoque(
      mov.tipoItem,
      mov.descricaoItem,
      mov.unidadeMedida,
    );
    if (!itens.has(chave)) {
      const normalizado = normalizarItemEstoque(
        mov.descricaoItem,
        mov.unidadeMedida,
      );
      itens.set(chave, {
        tipoItem: mov.tipoItem,
        descricao: normalizado.descricaoItem,
        unidade: normalizado.unidadeMedida,
        movimentacoes: [],
      });
    }
    itens.get(chave)?.movimentacoes.push(mov);
  }
  return [...itens.values()];
}

export function montarRelatorioDoacoes(
  doacoes: DoacaoRelatorio[],
  movimentacoes: MovimentacaoEstoqueRelatorio[],
  periodo: Periodo,
  meta: MetadadosRelatorio,
): DocumentoRelatorio {
  const agora = meta.geradoEm;
  const doPeriodo = doacoes.filter((d) =>
    noPeriodo(d.dataRecebimento, periodo),
  );
  const emDinheiro = doPeriodo.filter((d) => d.tipo === TipoDoacao.DINHEIRO);
  const emItens = doPeriodo.filter((d) => d.tipo !== TipoDoacao.DINHEIRO);
  const totalDinheiro = emDinheiro.reduce((s, d) => s + (d.valor ?? 0), 0);
  const mediaDinheiro = emDinheiro.length
    ? totalDinheiro / emDinheiro.length
    : null;
  const anonimas = doPeriodo.filter((d) => !d.doador).length;

  // Doadores
  const doadores = new Map<string, ResumoDoador>();
  for (const doacao of doPeriodo) {
    if (!doacao.doador) continue;
    const atual = doadores.get(doacao.doador.id) ?? {
      nome: doacao.doador.nome,
      doacoes: 0,
      dinheiro: 0,
      itens: 0,
    };
    atual.doacoes += 1;
    if (doacao.tipo === TipoDoacao.DINHEIRO)
      atual.dinheiro += doacao.valor ?? 0;
    else atual.itens += 1;
    doadores.set(doacao.doador.id, atual);
  }
  const primeiraDoacao = new Map<string, Date>();
  for (const doacao of doacoes) {
    if (doacao.doador && !primeiraDoacao.has(doacao.doador.id)) {
      primeiraDoacao.set(doacao.doador.id, doacao.dataRecebimento);
    }
  }
  const novosDoadores = [...doadores.keys()].filter((id) =>
    noPeriodo(primeiraDoacao.get(id), periodo),
  ).length;
  const recorrentes = [...doadores.values()].filter(
    (d) => d.doacoes > 1,
  ).length;
  const rankingDoadores = [...doadores.values()].sort(
    (a, b) => b.dinheiro - a.dinheiro || b.doacoes - a.doacoes,
  );

  // Itens recebidos no período
  const itensRecebidos = new Map<
    string,
    {
      tipo: TipoDoacao;
      descricao: string;
      unidade: string;
      quantidade: number;
      doacoes: number;
    }
  >();
  for (const doacao of emItens) {
    const { descricaoItem, unidadeMedida } = normalizarItemEstoque(
      doacao.descricao ?? TIPO_DOACAO_LABEL[doacao.tipo],
      doacao.unidadeMedida,
    );
    const chave = gerarChaveItemEstoque(
      doacao.tipo,
      descricaoItem,
      unidadeMedida,
    );
    const atual = itensRecebidos.get(chave) ?? {
      tipo: doacao.tipo,
      descricao: descricaoItem,
      unidade: unidadeMedida,
      quantidade: 0,
      doacoes: 0,
    };
    atual.quantidade += doacao.quantidade ?? 0;
    atual.doacoes += 1;
    itensRecebidos.set(chave, atual);
  }

  // Estoque
  const estoque = agruparEstoque(movimentacoes)
    .map((item) => {
      const noIntervalo = item.movimentacoes.filter((m) =>
        noPeriodo(m.dataMovimento, periodo),
      );
      const somar = (tipo: TipoMovimentacaoEstoque) =>
        noIntervalo
          .filter((m) => m.tipo === tipo)
          .reduce((s, m) => s + m.quantidade, 0);
      return {
        ...item,
        entradas: somar(TipoMovimentacaoEstoque.ENTRADA),
        saidas: somar(TipoMovimentacaoEstoque.SAIDA),
        saldo: calcularSaldoDeMovimentacoes(item.movimentacoes).toNumber(),
      };
    })
    .sort(
      (a, b) =>
        a.tipoItem.localeCompare(b.tipoItem) ||
        a.descricao.localeCompare(b.descricao, 'pt-BR'),
    );
  const comSaldo = estoque.filter((i) => i.saldo > 0).length;
  const zerados = estoque.length - comSaldo;
  const movimentosPeriodo = movimentacoes.filter((m) =>
    noPeriodo(m.dataMovimento, periodo),
  );
  const entradasEstoque = movimentosPeriodo.filter(
    (m) => m.tipo === TipoMovimentacaoEstoque.ENTRADA,
  ).length;
  const saidasEstoque = movimentosPeriodo.filter(
    (m) => m.tipo === TipoMovimentacaoEstoque.SAIDA,
  ).length;

  // Resumo
  const resumo: string[] = [];
  let arrecadacao =
    `${introducaoPeriodo(periodo)}, a ONG recebeu ${plural(doPeriodo.length, 'doação', 'doações')}: ` +
    `${plural(emDinheiro.length, 'em dinheiro', 'em dinheiro')}, somando ${formatarMoeda(totalDinheiro)}, ` +
    `e ${plural(emItens.length, 'de itens', 'de itens')} (ração, medicamentos, produtos de limpeza e outros).`;
  if (doadores.size > 0 || anonimas > 0) {
    arrecadacao += ` Contribuíram ${plural(doadores.size, 'doador identificado', 'doadores identificados')}`;
    arrecadacao +=
      novosDoadores > 0
        ? `, dos quais ${plural(novosDoadores, 'doou', 'doaram')} pela primeira vez`
        : '';
    arrecadacao +=
      anonimas > 0
        ? `, além de ${plural(anonimas, 'doação anônima', 'doações anônimas')}.`
        : '.';
  }
  resumo.push(arrecadacao);
  if (estoque.length > 0) {
    let textoEstoque =
      `No estoque, foram registradas ${plural(entradasEstoque, 'entrada', 'entradas')} e ${plural(saidasEstoque, 'saída', 'saídas')} no período. ` +
      `Na data de emissão, ${plural(comSaldo, 'item tem', 'itens têm')} saldo disponível`;
    textoEstoque +=
      zerados > 0
        ? ` e ${plural(zerados, 'item está zerado', 'itens estão zerados')}, o que pode orientar as próximas campanhas de arrecadação.`
        : '.';
    resumo.push(textoEstoque);
  }
  resumo.push(
    'Agradecemos a cada doador: as contribuições sustentam o resgate, o tratamento veterinário e o acolhimento dos animais até a adoção.',
  );

  const intervalos = intervalosDoPeriodo(
    periodo,
    doacoes.map((d) => d.dataRecebimento),
    agora,
  );
  const tiposPresentes = Object.values(TipoDoacao).filter((tipo) =>
    doPeriodo.some((d) => d.tipo === tipo),
  );

  return {
    titulo: 'Relatório de Doações',
    finalidade:
      'Arrecadação em dinheiro e itens, doadores e a movimentação do estoque da ONG no período.',
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    periodo: descreverPeriodo(periodo),
    filtros: [],
    indicadores: [
      {
        rotulo: 'Arrecadado em dinheiro',
        valor: formatarMoeda(totalDinheiro),
        detalhe: 'no período',
      },
      {
        rotulo: 'Doações recebidas',
        valor: `${doPeriodo.length}`,
        detalhe: `${emDinheiro.length} em dinheiro · ${emItens.length} em itens`,
      },
      {
        rotulo: 'Doadores no período',
        valor: `${doadores.size}`,
        detalhe: `${plural(novosDoadores, 'novo', 'novos')} · ${plural(recorrentes, 'recorrente', 'recorrentes')}`,
      },
      {
        rotulo: 'Doação média em dinheiro',
        valor: mediaDinheiro === null ? '-' : formatarMoeda(mediaDinheiro),
      },
      {
        rotulo: 'Doações anônimas',
        valor: `${anonimas}`,
        detalhe: 'no período',
      },
      {
        rotulo: 'Itens com saldo',
        valor: `${comSaldo}`,
        detalhe: zerados
          ? `${plural(zerados, 'item zerado', 'itens zerados')}`
          : 'nenhum item zerado',
      },
      {
        rotulo: 'Entradas no estoque',
        valor: `${entradasEstoque}`,
        detalhe: 'movimentações no período',
      },
      {
        rotulo: 'Saídas do estoque',
        valor: `${saidasEstoque}`,
        detalhe: 'movimentações no período',
      },
    ],
    resumo,
    secoes: [
      {
        titulo: 'Arrecadação',
        descricao: `Doações recebidas ao longo de ${descreverPeriodo(periodo).toLowerCase()}.`,
        graficos: [
          {
            tipo: 'colunas',
            titulo: 'Arrecadação em dinheiro',
            formato: 'moeda',
            categorias: intervalos.map((i) => i.rotulo),
            series: [
              {
                nome: 'Valor recebido',
                cor: PALETA.verde,
                valores: somarPorIntervalo(
                  intervalos,
                  emDinheiro.map((d) => ({
                    data: d.dataRecebimento,
                    valor: d.valor ?? 0,
                  })),
                ),
              },
            ],
          },
          {
            tipo: 'colunas',
            titulo: 'Quantidade de doações',
            categorias: intervalos.map((i) => i.rotulo),
            series: [
              {
                nome: 'Em dinheiro',
                cor: PALETA.verde,
                valores: somarPorIntervalo(
                  intervalos,
                  emDinheiro.map((d) => ({ data: d.dataRecebimento })),
                ),
              },
              {
                nome: 'Em itens',
                cor: PALETA.laranja,
                valores: somarPorIntervalo(
                  intervalos,
                  emItens.map((d) => ({ data: d.dataRecebimento })),
                ),
              },
            ],
          },
          {
            tipo: 'rosca',
            titulo: 'Doações por tipo',
            centro: { valor: `${doPeriodo.length}`, rotulo: 'doações' },
            fatias: (tiposPresentes.length
              ? tiposPresentes
              : Object.values(TipoDoacao)
            ).map((tipo) => ({
              rotulo: TIPO_DOACAO_LABEL[tipo],
              valor: doPeriodo.filter((d) => d.tipo === tipo).length,
              cor: COR_TIPO[tipo],
            })),
          },
          {
            tipo: 'barras',
            titulo: 'Principais doadores em dinheiro',
            formato: 'moeda',
            vazio: 'Nenhuma doação em dinheiro identificada no período.',
            itens: rankingDoadores
              .filter((d) => d.dinheiro > 0)
              .slice(0, 5)
              .map((d) => ({ rotulo: d.nome, valor: d.dinheiro })),
          },
        ],
      },
      {
        titulo: 'Doadores',
        descricao: `Doadores identificados no período (até ${LIMITE_DOADORES}), ordenados pelo valor doado em dinheiro. Doações anônimas não aparecem nesta lista.`,
        tabelas: [
          {
            colunas: ['Doador', 'Doações', 'Em dinheiro', 'Doações de itens'],
            larguras: ['*', 55, 85, 85],
            linhas: rankingDoadores
              .slice(0, LIMITE_DOADORES)
              .map((d) => [
                d.nome,
                `${d.doacoes}`,
                d.dinheiro > 0 ? formatarMoeda(d.dinheiro) : '-',
                `${d.itens}`,
              ]),
            vazio: 'Nenhum doador identificado no período.',
          },
        ],
      },
      {
        titulo: 'Itens e estoque',
        descricao:
          'Itens recebidos em doação no período e a movimentação do estoque. O saldo atual considera todo o histórico até a data de emissão.',
        tabelas: [
          {
            titulo: 'Itens recebidos no período',
            colunas: ['Tipo', 'Item', 'Doações', 'Quantidade'],
            larguras: [90, '*', 55, 90],
            linhas: [...itensRecebidos.values()]
              .sort(
                (a, b) =>
                  a.tipo.localeCompare(b.tipo) ||
                  a.descricao.localeCompare(b.descricao, 'pt-BR'),
              )
              .map((i) => [
                TIPO_DOACAO_LABEL[i.tipo],
                i.descricao,
                `${i.doacoes}`,
                formatarQuantidade(i.quantidade, i.unidade),
              ]),
            vazio: 'Nenhuma doação de itens no período.',
          },
          {
            titulo: 'Estoque',
            colunas: [
              'Tipo',
              'Item',
              'Entradas no período',
              'Saídas no período',
              'Saldo atual',
            ],
            larguras: [80, '*', 75, 75, 75],
            linhas: estoque.map((i) => [
              TIPO_DOACAO_LABEL[i.tipoItem],
              i.descricao,
              formatarQuantidade(i.entradas, i.unidade),
              formatarQuantidade(i.saidas, i.unidade),
              i.saldo > 0 ? formatarQuantidade(i.saldo, i.unidade) : 'Zerado',
            ]),
            vazio: 'Nenhum item movimentado no estoque.',
          },
        ],
      },
    ],
    notas: [
      'Valores e quantidades consideram as doações com data de recebimento dentro do período analisado.',
      'O saldo do estoque segue a mesma regra da tela de estoque: entradas somam, saídas subtraem e ajustes redefinem o saldo do item.',
      'Doações e movimentações excluídas do cadastro não são consideradas.',
    ],
  };
}
