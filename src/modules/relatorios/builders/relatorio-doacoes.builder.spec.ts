import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import {
  DoacaoRelatorio,
  MovimentacaoEstoqueRelatorio,
} from '../repositories/relatorios.repository.interface';
import { montarRelatorioDoacoes } from './relatorio-doacoes.builder';

const AGORA = new Date('2026-11-24T15:00:00Z');
const NOVEMBRO = {
  de: new Date('2026-11-01T03:00:00Z'),
  ate: new Date('2026-12-01T02:59:59Z'),
};
const META = { geradoEm: AGORA, geradoPor: 'Malba Vinicius' };

const JOANA = { id: 'joana', nome: 'Joana Pereira' };
const PETSHOP = { id: 'petshop', nome: 'PetShop Amigo Fiel' };

function doacao(
  data: string,
  tipo: TipoDoacao,
  doador: DoacaoRelatorio['doador'],
  dados: Partial<DoacaoRelatorio> = {},
): DoacaoRelatorio {
  return {
    tipo,
    valor: null,
    quantidade: null,
    unidadeMedida: null,
    descricao: null,
    dataRecebimento: new Date(`${data}T15:00:00Z`),
    doador,
    ...dados,
  };
}

function movimento(
  data: string,
  tipo: TipoMovimentacaoEstoque,
  descricaoItem: string,
  quantidade: number,
  unidadeMedida = 'KG',
): MovimentacaoEstoqueRelatorio {
  return {
    tipo,
    tipoItem: TipoDoacao.RACAO,
    descricaoItem,
    quantidade,
    unidadeMedida,
    dataMovimento: new Date(`${data}T15:00:00Z`),
  };
}

const DOACOES = [
  doacao('2026-10-10', TipoDoacao.DINHEIRO, JOANA, { valor: 100 }),
  doacao('2026-11-02', TipoDoacao.DINHEIRO, JOANA, { valor: 150 }),
  doacao('2026-11-05', TipoDoacao.DINHEIRO, PETSHOP, { valor: 500 }),
  doacao('2026-11-08', TipoDoacao.RACAO, PETSHOP, {
    descricao: 'Ração cães',
    quantidade: 40,
    unidadeMedida: 'kg',
  }),
  doacao('2026-11-20', TipoDoacao.DINHEIRO, null, { valor: 50 }),
];

const MOVIMENTOS = [
  movimento('2026-10-01', TipoMovimentacaoEstoque.ENTRADA, 'Ração cães', 20),
  movimento('2026-11-08', TipoMovimentacaoEstoque.ENTRADA, 'ração  cães', 40),
  movimento('2026-11-15', TipoMovimentacaoEstoque.SAIDA, 'Ração cães', 25),
  movimento('2026-10-01', TipoMovimentacaoEstoque.ENTRADA, 'Ração gatos', 5),
  movimento('2026-11-12', TipoMovimentacaoEstoque.AJUSTE, 'Ração gatos', 0),
];

// O Intl separa "R$" do valor com espaço não separável.
const brl = (texto: string) => texto.replace('R$ ', 'R$\u00a0');

type Documento = ReturnType<typeof montarRelatorioDoacoes>;

const valor = (doc: Documento, rotulo: string) =>
  doc.indicadores.find((i) => i.rotulo === rotulo);

function secao(doc: Documento, titulo: string) {
  const encontrada = doc.secoes.find((s) => s.titulo === titulo);
  if (!encontrada) throw new Error(`Seção não encontrada: ${titulo}`);
  return encontrada;
}

describe('montarRelatorioDoacoes', () => {
  it('soma a arrecadação e conta doadores do período', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);

    expect(valor(doc, 'Arrecadado em dinheiro')?.valor).toBe(brl('R$ 700,00'));
    expect(valor(doc, 'Doações recebidas')).toMatchObject({
      valor: '4',
      detalhe: '3 em dinheiro · 1 em itens',
    });
    // Joana doou antes do período: só a PetShop é doadora nova.
    expect(valor(doc, 'Doadores no período')).toMatchObject({
      valor: '2',
      detalhe: '1 novo · 1 recorrente',
    });
    expect(valor(doc, 'Doação média em dinheiro')?.valor).toBe(
      brl('R$ 233,33'),
    );
    expect(valor(doc, 'Doações anônimas')?.valor).toBe('1');
  });

  it('ranqueia doadores pelo valor doado em dinheiro', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);
    const [tabela] = secao(doc, 'Doadores').tabelas ?? [];

    expect(tabela.linhas).toEqual([
      ['PetShop Amigo Fiel', '2', brl('R$ 500,00'), '1'],
      ['Joana Pereira', '1', brl('R$ 150,00'), '0'],
    ]);
  });

  it('calcula o saldo do estoque com a mesma regra da tela de estoque', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);
    const estoque = secao(doc, 'Itens e estoque').tabelas?.find(
      (t) => t.titulo === 'Estoque',
    );

    // "ração  cães" e "Ração cães" são o mesmo item; o ajuste zera a ração de gatos.
    expect(estoque?.linhas).toEqual([
      ['Ração', 'Ração cães', '40 KG', '25 KG', '35 KG'],
      ['Ração', 'Ração gatos', '0 KG', '0 KG', 'Zerado'],
    ]);
    expect(valor(doc, 'Itens com saldo')).toMatchObject({
      valor: '1',
      detalhe: '1 item zerado',
    });
  });

  it('agrupa os itens recebidos no período', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);
    const itens = secao(doc, 'Itens e estoque').tabelas?.find(
      (t) => t.titulo === 'Itens recebidos no período',
    );

    expect(itens?.linhas).toEqual([['Ração', 'Ração cães', '1', '40 KG']]);
  });

  it('monta a série de arrecadação por semana e a distribuição por tipo', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);
    const [arrecadacao, , porTipo] = secao(doc, 'Arrecadação').graficos ?? [];

    expect(arrecadacao).toMatchObject({
      tipo: 'colunas',
      formato: 'moeda',
      categorias: ['01/11', '08/11', '15/11', '22/11'],
      series: [{ valores: [650, 0, 50, 0] }],
    });
    expect(porTipo).toMatchObject({
      tipo: 'rosca',
      fatias: [
        { rotulo: 'Dinheiro', valor: 3 },
        { rotulo: 'Ração', valor: 1 },
      ],
    });
  });

  it('descreve a arrecadação e o estoque no resumo', () => {
    const doc = montarRelatorioDoacoes(DOACOES, MOVIMENTOS, NOVEMBRO, META);

    expect(doc.resumo[0]).toContain(
      brl(
        'Entre 01/11/2026 e 30/11/2026, a ONG recebeu 4 doações: 3 em dinheiro, somando R$ 700,00, e 1 de itens',
      ),
    );
    expect(doc.resumo[0]).toContain(
      'Contribuíram 2 doadores identificados, dos quais 1 doou pela primeira vez, além de 1 doação anônima.',
    );
    expect(doc.resumo[1]).toContain('1 item está zerado');
  });

  it('produz um relatório coerente sem doações', () => {
    const doc = montarRelatorioDoacoes([], [], NOVEMBRO, META);

    expect(valor(doc, 'Arrecadado em dinheiro')?.valor).toBe(brl('R$ 0,00'));
    expect(valor(doc, 'Doação média em dinheiro')?.valor).toBe('-');
  });
});
