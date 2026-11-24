import { EspecieAnimal } from '@prisma/client';
import {
  SituacaoAcolhedor,
  calcularSituacao,
} from '#src/modules/tutores/enums/situacao-acolhedor.enum';
import { DocumentoRelatorio } from '../pdf/documento-relatorio';
import { PALETA } from '../pdf/graficos';
import {
  AcolhedorRelatorio,
  AdocaoRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  ESPECIE_LABEL,
  Periodo,
  STATUS_LABEL,
  descreverPeriodo,
  diasEntre,
  formatarData,
  formatarDuracao,
  introducaoPeriodo,
  intervalosDoPeriodo,
  media,
  noPeriodo,
  plural,
  somarPorIntervalo,
} from '../utils/formatacao.util';
import { MetadadosRelatorio } from './relatorio-animais.builder';

export const LIMITE_ESPERA_DIAS = 90;

function situacaoDe(acolhedor: AcolhedorRelatorio): SituacaoAcolhedor {
  return calcularSituacao(acolhedor.animaisVinculados.length);
}

function ordenarPorNome(acolhedores: AcolhedorRelatorio[]) {
  return [...acolhedores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function contarEspecies(especies: EspecieAnimal[]): string {
  const caes = especies.filter((e) => e === EspecieAnimal.CAO).length;
  return `${plural(caes, 'cão', 'cães')} e ${plural(especies.length - caes, 'gato', 'gatos')}`;
}

function faixaDeGuarda(dias: number): string {
  if (dias < 90) return 'Até 3 meses';
  if (dias < 180) return 'De 3 a 6 meses';
  if (dias < 365) return 'De 6 meses a 1 ano';
  return 'Mais de 1 ano';
}

const FAIXAS_GUARDA = [
  'Até 3 meses',
  'De 3 a 6 meses',
  'De 6 meses a 1 ano',
  'Mais de 1 ano',
];

export function montarRelatorioAcolhedores(
  acolhedores: AcolhedorRelatorio[],
  periodo: Periodo,
  meta: MetadadosRelatorio,
): DocumentoRelatorio {
  const agora = meta.geradoEm;
  const tutores = acolhedores.filter(
    (a) => situacaoDe(a) === SituacaoAcolhedor.TUTOR,
  );
  const adotantes = acolhedores.filter(
    (a) => situacaoDe(a) === SituacaoAcolhedor.ADOTANTE,
  );
  const todasAdocoes = acolhedores.flatMap((a) => a.adocoes);

  // Tutores e guardas vigentes
  const guardasAtivas = tutores
    .flatMap((t) => t.adocoes)
    .filter((a) => !a.devolvidoEm);
  const animaisSobGuarda = tutores.flatMap((tutor) =>
    tutor.animaisVinculados.map((animal) => ({
      tutor,
      animal,
      guarda: guardasAtivas.find(
        (a) => a.animal.numeroRegistro === animal.numeroRegistro,
      ),
    })),
  );
  const diasDeGuarda = guardasAtivas.map((a) => diasEntre(a.dataAdocao, agora));
  const mediaGuarda = media(diasDeGuarda);
  const comMaisDeUm = tutores.filter(
    (t) => t.animaisVinculados.length > 1,
  ).length;

  // Adotantes (fila de espera e histórico)
  const aguardando = adotantes
    .filter((a) => a.adocoes.length === 0)
    .map((adotante) => ({
      adotante,
      dias: diasEntre(adotante.criadoEm, agora),
    }))
    .sort((x, y) => y.dias - x.dias);
  const comDevolucao = adotantes.filter((a) =>
    a.adocoes.some((ad) => ad.devolvidoEm),
  );
  const mediaEspera = media(aguardando.map((a) => a.dias));
  const esperaLonga = aguardando.filter(
    (a) => a.dias >= LIMITE_ESPERA_DIAS,
  ).length;

  // Período
  const novosCadastros = acolhedores.filter((a) =>
    noPeriodo(a.criadoEm, periodo),
  );
  const adocoesPeriodo = todasAdocoes.filter((a) =>
    noPeriodo(a.dataAdocao, periodo),
  );
  const devolucoesPeriodo = todasAdocoes.filter((a) =>
    noPeriodo(a.devolvidoEm, periodo),
  );
  const novosTutores = tutores.filter((t) => {
    const primeira = t.adocoes[0];
    return primeira && noPeriodo(primeira.dataAdocao, periodo);
  }).length;

  // Resumo
  const resumo: string[] = [];
  if (acolhedores.length === 0) {
    resumo.push('Na data de emissão, não há acolhedores cadastrados.');
  } else {
    let atual =
      `Na data de emissão, a ONG conta com ${plural(acolhedores.length, 'acolhedor cadastrado', 'acolhedores cadastrados')}: ` +
      `${plural(tutores.length, 'tutor', 'tutores')}, responsáveis por ${plural(animaisSobGuarda.length, 'animal resgatado', 'animais resgatados')} ` +
      `(${contarEspecies(animaisSobGuarda.map((g) => g.animal.especie))}), e ${plural(adotantes.length, 'adotante', 'adotantes')} sem animal vinculado.`;
    if (mediaGuarda !== null) {
      atual += ` Em média, os animais estão com seus tutores há ${formatarDuracao(mediaGuarda)}.`;
    }
    resumo.push(atual);
  }
  resumo.push(
    `${introducaoPeriodo(periodo)}, foram realizados ${plural(novosCadastros.length, 'novo cadastro', 'novos cadastros')}, ` +
      `${plural(novosTutores, 'pessoa se tornou tutora', 'pessoas se tornaram tutoras')} pela primeira vez, ` +
      `e foram registradas ${plural(adocoesPeriodo.length, 'adoção', 'adoções')} e ${plural(devolucoesPeriodo.length, 'devolução', 'devoluções')}.`,
  );
  if (aguardando.length > 0 || comDevolucao.length > 0) {
    let atencao = '';
    if (aguardando.length > 0) {
      atencao += `${plural(aguardando.length, 'adotante aguarda', 'adotantes aguardam')} a primeira adoção, em média há ${formatarDuracao(mediaEspera ?? 0)}`;
      atencao +=
        esperaLonga > 0
          ? ` (${plural(esperaLonga, 'cadastro', 'cadastros')} com mais de ${LIMITE_ESPERA_DIAS} dias): bons candidatos para contato ativo quando chegarem animais compatíveis.`
          : '.';
    }
    if (comDevolucao.length > 0) {
      atencao += ` ${plural(comDevolucao.length, 'adotante já devolveu', 'adotantes já devolveram')} animais à ONG; recomenda-se avaliar esse histórico antes de aprovar novas adoções.`;
    }
    resumo.push(atencao.trim());
  }

  const intervalos = intervalosDoPeriodo(
    periodo,
    [
      ...acolhedores.map((a) => a.criadoEm),
      ...todasAdocoes.map((a) => a.dataAdocao),
    ],
    agora,
  );

  const movimentacoes = [
    ...adocoesPeriodo.map((a) => ({ data: a.dataAdocao, tipo: 'Adoção', a })),
    ...devolucoesPeriodo.map((a) => ({
      data: a.devolvidoEm as Date,
      tipo: 'Devolução',
      a,
    })),
  ].sort((x, y) => x.data.getTime() - y.data.getTime());

  const ultimaDevolucao = (adocoes: AdocaoRelatorio[]) =>
    adocoes.filter((a) => a.devolvidoEm).at(-1);

  return {
    titulo: 'Relatório de Acolhedores',
    finalidade:
      'Tutores e adotantes da ONG: onde estão os animais adotados, há quanto tempo, e quem aguarda para adotar.',
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    periodo: descreverPeriodo(periodo),
    filtros: [],
    indicadores: [
      {
        rotulo: 'Acolhedores cadastrados',
        valor: `${acolhedores.length}`,
        detalhe: `${plural(tutores.length, 'tutor', 'tutores')} · ${plural(adotantes.length, 'adotante', 'adotantes')}`,
      },
      {
        rotulo: 'Animais sob guarda',
        valor: `${animaisSobGuarda.length}`,
        detalhe: contarEspecies(animaisSobGuarda.map((g) => g.animal.especie)),
      },
      {
        rotulo: 'Tempo médio de guarda',
        valor: mediaGuarda === null ? '-' : formatarDuracao(mediaGuarda),
        detalhe: comMaisDeUm
          ? `${plural(comMaisDeUm, 'tutor', 'tutores')} com 2+ animais`
          : undefined,
      },
      {
        rotulo: 'Espera média',
        valor: mediaEspera === null ? '-' : formatarDuracao(mediaEspera),
        detalhe: `${plural(aguardando.length, 'adotante aguardando', 'adotantes aguardando')}`,
      },
      {
        rotulo: 'Novos cadastros',
        valor: `${novosCadastros.length}`,
        detalhe: 'no período',
      },
      {
        rotulo: 'Novos tutores',
        valor: `${novosTutores}`,
        detalhe: 'primeira adoção no período',
      },
      {
        rotulo: 'Adoções no período',
        valor: `${adocoesPeriodo.length}`,
      },
      {
        rotulo: 'Devoluções no período',
        valor: `${devolucoesPeriodo.length}`,
        detalhe: comDevolucao.length
          ? `${plural(comDevolucao.length, 'adotante', 'adotantes')} com devolução no histórico`
          : undefined,
      },
    ],
    resumo,
    secoes: [
      {
        titulo: 'Perfil dos acolhedores',
        descricao: 'Posição na data de emissão.',
        graficos: [
          {
            tipo: 'rosca',
            titulo: 'Acolhedores por situação',
            centro: { valor: `${acolhedores.length}`, rotulo: 'cadastros' },
            fatias: [
              { rotulo: 'Tutores', valor: tutores.length, cor: PALETA.verde },
              {
                rotulo: 'Aguardando 1ª adoção',
                valor: aguardando.length,
                cor: PALETA.ambar,
              },
              {
                rotulo: 'Adotantes c/ devolução',
                valor: comDevolucao.length,
                cor: PALETA.cinza,
              },
              {
                rotulo: 'Outros adotantes',
                valor:
                  adotantes.length - aguardando.length - comDevolucao.length,
                cor: PALETA.azul,
              },
            ].filter((f) => f.valor > 0 || f.rotulo !== 'Outros adotantes'),
          },
          {
            tipo: 'barras',
            titulo: 'Há quanto tempo os animais estão com tutores',
            vazio: 'Nenhuma guarda vigente.',
            itens:
              diasDeGuarda.length === 0
                ? []
                : FAIXAS_GUARDA.map((faixa) => ({
                    rotulo: faixa,
                    valor: diasDeGuarda.filter(
                      (d) => faixaDeGuarda(d) === faixa,
                    ).length,
                  })),
          },
        ],
      },
      {
        titulo: 'Evolução no período',
        descricao: `Cadastros, adoções e devoluções ao longo de ${descreverPeriodo(periodo).toLowerCase()}.`,
        graficos: [
          {
            tipo: 'colunas',
            titulo: 'Movimentação de acolhedores',
            categorias: intervalos.map((i) => i.rotulo),
            series: [
              {
                nome: 'Novos cadastros',
                cor: PALETA.azul,
                valores: somarPorIntervalo(
                  intervalos,
                  novosCadastros.map((a) => ({ data: a.criadoEm })),
                ),
              },
              {
                nome: 'Adoções',
                cor: PALETA.verde,
                valores: somarPorIntervalo(
                  intervalos,
                  adocoesPeriodo.map((a) => ({ data: a.dataAdocao })),
                ),
              },
              {
                nome: 'Devoluções',
                cor: PALETA.cinza,
                valores: somarPorIntervalo(
                  intervalos,
                  devolucoesPeriodo.map((a) => ({ data: a.devolvidoEm })),
                ),
              },
            ],
          },
        ],
        tabelas: [
          {
            titulo: 'Adoções e devoluções do período',
            colunas: [
              'Data',
              'Evento',
              'Animal',
              'Acolhedor',
              'Protetor da adoção',
            ],
            larguras: [52, 55, 90, '*', 90],
            linhas: movimentacoes.map(({ data, tipo, a }) => [
              formatarData(data),
              tipo,
              `${a.animal.nome} (${a.animal.numeroRegistro})`,
              `${a.tutor.nome} (#${a.tutor.codigo})`,
              a.protetor,
            ]),
            vazio: 'Nenhuma adoção ou devolução no período.',
          },
        ],
      },
      {
        titulo: 'Animais sob guarda',
        descricao:
          'Onde está cada animal resgatado que hoje vive com um tutor, ordenado pela data de adoção.',
        tabelas: [
          {
            colunas: [
              'Registro',
              'Animal',
              'Espécie',
              'Situação',
              'Tutor',
              'Adotado em',
              'Tempo de guarda',
            ],
            larguras: [62, 70, 40, 55, '*', 52, 55],
            linhas: [...animaisSobGuarda]
              .sort(
                (x, y) =>
                  (x.guarda?.dataAdocao.getTime() ?? 0) -
                  (y.guarda?.dataAdocao.getTime() ?? 0),
              )
              .map(({ tutor, animal, guarda }) => [
                animal.numeroRegistro,
                animal.nome,
                ESPECIE_LABEL[animal.especie],
                STATUS_LABEL[animal.status],
                `${tutor.nome} (#${tutor.codigo})`,
                guarda ? formatarData(guarda.dataAdocao) : '-',
                guarda
                  ? formatarDuracao(diasEntre(guarda.dataAdocao, agora))
                  : '-',
              ]),
            vazio: 'Nenhum animal sob guarda de tutores.',
          },
        ],
      },
      {
        titulo: 'Pontos de atenção',
        descricao:
          'Adotantes que já devolveram animais e cadastros que aguardam há mais tempo a primeira adoção.',
        tabelas: [
          {
            titulo: 'Adotantes com histórico de devolução',
            colunas: [
              'Cadastro',
              'Nome',
              'Adoções',
              'Devoluções',
              'Última devolução',
              'Observações',
            ],
            larguras: [45, 100, 40, 50, 55, '*'],
            linhas: ordenarPorNome(comDevolucao).map((a) => {
              const ultima = ultimaDevolucao(a.adocoes);
              return [
                `#${a.codigo}`,
                a.nome,
                `${a.adocoes.length}`,
                `${a.adocoes.filter((ad) => ad.devolvidoEm).length}`,
                formatarData(ultima?.devolvidoEm),
                ultima?.observacoesDevolucao?.trim() || '-',
              ];
            }),
            vazio: 'Nenhum adotante com histórico de devolução.',
          },
          {
            titulo: 'Aguardando a primeira adoção',
            colunas: [
              'Cadastro',
              'Nome',
              'Cadastrado em',
              'Espera',
              'Telefone',
            ],
            larguras: [45, '*', 60, 60, 85],
            linhas: aguardando.map(({ adotante, dias }) => [
              `#${adotante.codigo}`,
              adotante.nome,
              formatarData(adotante.criadoEm),
              formatarDuracao(dias),
              adotante.telefone,
            ]),
            vazio: 'Nenhum cadastro aguardando a primeira adoção.',
          },
        ],
      },
    ],
    notas: [
      'Tutor é o acolhedor com ao menos um animal vinculado; adotante é o acolhedor cadastrado sem animal vinculado no momento da emissão.',
      'Cadastros, adoções e devoluções consideram o período analisado; perfil, guardas e fila de espera referem-se à data de emissão.',
      'Novo tutor é quem realizou a primeira adoção dentro do período.',
      'Acolhedores e animais excluídos do cadastro não são considerados.',
    ],
  };
}
