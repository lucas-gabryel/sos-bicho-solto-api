import { EspecieAnimal } from '@prisma/client';
import {
  DocumentoRelatorio,
  TabelaRelatorio,
} from '../pdf/documento-relatorio';
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
  juntarLista,
  mascararCpf,
  media,
  noPeriodo,
  plural,
  temPeriodo,
} from '../utils/formatacao.util';
import { MetadadosRelatorio } from './relatorio-animais.builder';

export const LIMITE_ESPERA_DIAS = 90;

const REGRA_SITUACAO =
  'Tutores são acolhedores com ao menos um animal vinculado; adotantes são acolhedores cadastrados sem animal vinculado no momento.';

function teveAtividade(acolhedor: AcolhedorRelatorio, periodo: Periodo) {
  if (!temPeriodo(periodo)) return true;
  return (
    noPeriodo(acolhedor.criadoEm, periodo) ||
    acolhedor.adocoes.some(
      (a) =>
        noPeriodo(a.dataAdocao, periodo) || noPeriodo(a.devolvidoEm, periodo),
    )
  );
}

function ordenarPorNome(acolhedores: AcolhedorRelatorio[]) {
  return [...acolhedores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function descreverContato(acolhedor: AcolhedorRelatorio): string {
  return (
    `CPF ${mascararCpf(acolhedor.cpf)}. Telefone ${acolhedor.telefone} · E-mail ${acolhedor.email}. ` +
    `Endereço: ${acolhedor.endereco}.`
  );
}

function tabelaHistoricoAdocoes(
  adocoes: AdocaoRelatorio[],
  agora: Date,
): TabelaRelatorio {
  return {
    titulo: 'Histórico de adoções',
    colunas: [
      'Animal',
      'Adoção',
      'Devolução',
      'Tempo com o tutor',
      'Protetor',
      'Observações',
    ],
    larguras: [80, 52, 52, 55, 70, '*'],
    linhas: adocoes.map((a) => [
      `${a.animal.nome} (${a.animal.numeroRegistro})`,
      formatarData(a.dataAdocao),
      a.devolvidoEm ? formatarData(a.devolvidoEm) : 'Vigente',
      formatarDuracao(diasEntre(a.dataAdocao, a.devolvidoEm ?? agora)),
      a.protetor,
      [a.observacoes, a.observacoesDevolucao]
        .map((o) => o?.trim())
        .filter(Boolean)
        .join(' | ') || '-',
    ]),
    vazio: 'Nenhuma adoção registrada.',
  };
}

function descreverHistorico(adocoes: AdocaoRelatorio[]): string {
  const devolvidas = adocoes.filter((a) => a.devolvidoEm).length;
  if (adocoes.length === 0) return 'Ainda não realizou adoções pela ONG.';
  if (devolvidas === 0) {
    return `No total, realizou ${plural(adocoes.length, 'adoção', 'adoções')} pela ONG, sem nenhuma devolução.`;
  }
  return `No total, realizou ${plural(adocoes.length, 'adoção', 'adoções')} pela ONG, das quais ${plural(devolvidas, 'foi devolvida', 'foram devolvidas')}.`;
}

function contarEspecies(especies: EspecieAnimal[]): string {
  const caes = especies.filter((e) => e === EspecieAnimal.CAO).length;
  return `${plural(caes, 'cão', 'cães')} e ${plural(especies.length - caes, 'gato', 'gatos')}`;
}

export function montarRelatorioTutores(
  tutores: AcolhedorRelatorio[],
  periodo: Periodo,
  meta: MetadadosRelatorio,
): DocumentoRelatorio {
  const agora = meta.geradoEm;
  const todasAdocoes = tutores.flatMap((t) => t.adocoes);
  const guardasAtivas = todasAdocoes.filter((a) => !a.devolvidoEm);
  const animaisSobGuarda = tutores.flatMap((t) =>
    t.animaisVinculados.map((animal) => ({ tutor: t, animal })),
  );
  const comMaisDeUm = tutores.filter(
    (t) => t.animaisVinculados.length > 1,
  ).length;
  const diasDeGuarda = guardasAtivas.map((a) => diasEntre(a.dataAdocao, agora));
  const mediaGuarda = media(diasDeGuarda);
  const guardasMaisDeUmAno = diasDeGuarda.filter((d) => d >= 365).length;

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

  const especiesSobGuarda = animaisSobGuarda.map((g) => g.animal.especie);

  const resumo: string[] = [];
  if (tutores.length === 0) {
    resumo.push('Na data de emissão, não há tutores com animais vinculados.');
  } else {
    let atual =
      `Na data de emissão, a ONG conta com ${plural(tutores.length, 'tutor ativo', 'tutores ativos')}, ` +
      `responsáveis por ${plural(animaisSobGuarda.length, 'animal resgatado', 'animais resgatados')} ` +
      `(${contarEspecies(especiesSobGuarda)}). `;
    atual +=
      comMaisDeUm > 0
        ? `${plural(comMaisDeUm, 'tutor cuida', 'tutores cuidam')} de mais de um animal. `
        : '';
    if (mediaGuarda !== null) {
      atual += `Em média, os animais estão com seus tutores há ${formatarDuracao(mediaGuarda)}`;
      atual +=
        guardasMaisDeUmAno > 0
          ? `, e ${plural(guardasMaisDeUmAno, 'adoção já supera', 'adoções já superam')} um ano de convivência.`
          : '.';
    }
    resumo.push(atual.trim());
  }
  resumo.push(
    `${introducaoPeriodo(periodo)}, ${plural(novosTutores, 'pessoa se tornou tutora', 'pessoas se tornaram tutoras')} pela primeira vez ` +
      `e os tutores atuais realizaram ${plural(adocoesPeriodo.length, 'adoção', 'adoções')}` +
      (devolucoesPeriodo.length > 0
        ? `, com ${plural(devolucoesPeriodo.length, 'devolução registrada', 'devoluções registradas')}.`
        : ', sem registro de devoluções.'),
  );

  const guardaAtivaDe = (registro: string) =>
    guardasAtivas.find((a) => a.animal.numeroRegistro === registro);

  const movimentacoes = [
    ...adocoesPeriodo.map((a) => ({ data: a.dataAdocao, tipo: 'Adoção', a })),
    ...devolucoesPeriodo.map((a) => ({
      data: a.devolvidoEm as Date,
      tipo: 'Devolução',
      a,
    })),
  ].sort((x, y) => x.data.getTime() - y.data.getTime());

  const fichas = ordenarPorNome(tutores)
    .filter((t) => teveAtividade(t, periodo))
    .map((tutor) => {
      const animais = tutor.animaisVinculados.map((animal) => {
        const guarda = guardaAtivaDe(animal.numeroRegistro);
        const especie = ESPECIE_LABEL[animal.especie].toLowerCase();
        return guarda
          ? `${animal.nome} (${especie}, sob guarda desde ${formatarData(guarda.dataAdocao)}, há ${formatarDuracao(diasEntre(guarda.dataAdocao, agora))})`
          : `${animal.nome} (${especie})`;
      });
      return {
        titulo: `${tutor.nome} · Cadastro #${tutor.codigo}`,
        subtitulo: `Tutor · ${plural(animais.length, 'animal sob guarda', 'animais sob guarda')}`,
        paragrafos: [
          `Cadastro realizado em ${formatarData(tutor.criadoEm)}. ` +
            `Responsável atualmente por ${plural(animais.length, 'animal', 'animais')}: ${juntarLista(animais)}. ` +
            descreverHistorico(tutor.adocoes),
          descreverContato(tutor),
        ],
        tabelas: [tabelaHistoricoAdocoes(tutor.adocoes, agora)],
      };
    });

  return {
    titulo: 'Relatório Histórico de Tutores',
    finalidade: `Apresenta quem está com os animais resgatados pela ONG, há quanto tempo e o histórico de adoções de cada tutor. ${REGRA_SITUACAO}`,
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    filtros: [{ rotulo: 'Período', valor: descreverPeriodo(periodo) }],
    indicadores: [
      { rotulo: 'Tutores ativos', valor: `${tutores.length}` },
      {
        rotulo: 'Animais sob guarda',
        valor: `${animaisSobGuarda.length}`,
        detalhe: contarEspecies(especiesSobGuarda),
      },
      {
        rotulo: 'Tutores com 2+ animais',
        valor: `${comMaisDeUm}`,
      },
      {
        rotulo: 'Tempo médio de guarda',
        valor: mediaGuarda === null ? '-' : formatarDuracao(mediaGuarda),
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
      },
      {
        rotulo: 'Guardas com mais de 1 ano',
        valor: `${guardasMaisDeUmAno}`,
      },
    ],
    resumo,
    secoes: [
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
            linhas: animaisSobGuarda
              .map(({ tutor, animal }) => ({
                tutor,
                animal,
                guarda: guardaAtivaDe(animal.numeroRegistro),
              }))
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
        titulo: 'Adoções e devoluções do período',
        descricao: `Período: ${descreverPeriodo(periodo)}.`,
        tabelas: [
          {
            colunas: [
              'Data',
              'Evento',
              'Animal',
              'Tutor',
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
    ],
    fichas: {
      titulo: 'Fichas históricas dos tutores',
      descricao: temPeriodo(periodo)
        ? 'Tutores com cadastro, adoção ou devolução no período.'
        : 'Todos os tutores ativos.',
      itens: fichas,
      vazio: 'Nenhum tutor atende aos filtros informados.',
    },
  };
}

export function montarRelatorioAdotantes(
  adotantes: AcolhedorRelatorio[],
  periodo: Periodo,
  meta: MetadadosRelatorio,
): DocumentoRelatorio {
  const agora = meta.geradoEm;
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
  const novosCadastros = adotantes.filter((a) =>
    noPeriodo(a.criadoEm, periodo),
  ).length;
  const devolucoesPeriodo = adotantes
    .flatMap((a) => a.adocoes)
    .filter((a) => noPeriodo(a.devolvidoEm, periodo)).length;
  const mediaEspera = media(aguardando.map((a) => a.dias));
  const esperaLonga = aguardando.filter(
    (a) => a.dias >= LIMITE_ESPERA_DIAS,
  ).length;

  const resumo: string[] = [];
  if (adotantes.length === 0) {
    resumo.push('Na data de emissão, não há adotantes cadastrados.');
  } else {
    let atual = `Na data de emissão, há ${plural(adotantes.length, 'adotante cadastrado', 'adotantes cadastrados')} sem animal vinculado. `;
    if (aguardando.length > 0) {
      atual += `Desses, ${plural(aguardando.length, 'aguarda', 'aguardam')} a primeira adoção, em média há ${formatarDuracao(mediaEspera ?? 0)} desde o cadastro`;
      atual +=
        esperaLonga > 0
          ? ` (${plural(esperaLonga, 'cadastro', 'cadastros')} com mais de ${LIMITE_ESPERA_DIAS} dias de espera). `
          : '. ';
    }
    atual +=
      comDevolucao.length > 0
        ? `${plural(comDevolucao.length, 'cadastro já adotou e devolveu', 'cadastros já adotaram e devolveram')} animais à ONG.`
        : 'Nenhum adotante possui histórico de devolução.';
    resumo.push(atual.trim());
  }
  resumo.push(
    `${introducaoPeriodo(periodo)}, foram realizados ${plural(novosCadastros, 'novo cadastro', 'novos cadastros')} de adotantes ` +
      `e ${plural(devolucoesPeriodo, 'devolução foi registrada', 'devoluções foram registradas')} por pessoas que hoje não têm animal vinculado.`,
  );
  if (esperaLonga > 0 || comDevolucao.length > 0) {
    resumo.push(
      [
        esperaLonga > 0
          ? 'Os cadastros com espera longa são bons candidatos para contato ativo quando chegarem animais compatíveis.'
          : '',
        comDevolucao.length > 0
          ? 'Recomenda-se avaliar o histórico de devoluções antes de aprovar novas adoções para esses cadastros.'
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  const fichas = ordenarPorNome(adotantes)
    .filter((a) => teveAtividade(a, periodo))
    .map((adotante) => {
      const devolvidas = adotante.adocoes.filter((a) => a.devolvidoEm);
      const situacao =
        adotante.adocoes.length === 0
          ? `Aguardando a primeira adoção há ${formatarDuracao(diasEntre(adotante.criadoEm, agora))}`
          : `${plural(devolvidas.length, 'devolução', 'devoluções')} no histórico`;
      return {
        titulo: `${adotante.nome} · Cadastro #${adotante.codigo}`,
        subtitulo: `Adotante · ${situacao}`,
        paragrafos: [
          `Cadastro realizado em ${formatarData(adotante.criadoEm)} (há ${formatarDuracao(diasEntre(adotante.criadoEm, agora))}). ` +
            descreverHistorico(adotante.adocoes),
          descreverContato(adotante),
        ],
        tabelas:
          adotante.adocoes.length > 0
            ? [tabelaHistoricoAdocoes(adotante.adocoes, agora)]
            : [],
      };
    });

  return {
    titulo: 'Relatório Histórico de Adotantes',
    finalidade: `Apresenta os interessados em adotar que estão sem animal vinculado: há quanto tempo aguardam e se já tiveram adoções devolvidas. ${REGRA_SITUACAO}`,
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    filtros: [{ rotulo: 'Período', valor: descreverPeriodo(periodo) }],
    indicadores: [
      { rotulo: 'Adotantes cadastrados', valor: `${adotantes.length}` },
      {
        rotulo: 'Novos cadastros',
        valor: `${novosCadastros}`,
        detalhe: 'no período',
      },
      {
        rotulo: 'Aguardando 1ª adoção',
        valor: `${aguardando.length}`,
        detalhe:
          mediaEspera === null
            ? undefined
            : `espera média de ${formatarDuracao(mediaEspera)}`,
      },
      {
        rotulo: 'Com devolução no histórico',
        valor: `${comDevolucao.length}`,
      },
      {
        rotulo: 'Devoluções no período',
        valor: `${devolucoesPeriodo}`,
      },
      {
        rotulo: `Espera acima de ${LIMITE_ESPERA_DIAS} dias`,
        valor: `${esperaLonga}`,
      },
    ],
    resumo,
    secoes: [
      {
        titulo: 'Adotantes com histórico de devolução',
        descricao:
          'Cadastros que já adotaram e devolveram animais. Avalie o histórico antes de aprovar uma nova adoção.',
        tabelas: [
          {
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
              const devolvidas = a.adocoes.filter((ad) => ad.devolvidoEm);
              const ultima = devolvidas[devolvidas.length - 1];
              return [
                `#${a.codigo}`,
                a.nome,
                `${a.adocoes.length}`,
                `${devolvidas.length}`,
                formatarData(ultima.devolvidoEm),
                ultima.observacoesDevolucao?.trim() || '-',
              ];
            }),
            vazio: 'Nenhum adotante com histórico de devolução.',
          },
        ],
      },
      {
        titulo: 'Cadastros aguardando a primeira adoção',
        descricao: 'Ordenados pelo maior tempo de espera desde o cadastro.',
        tabelas: [
          {
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
    fichas: {
      titulo: 'Fichas históricas dos adotantes',
      descricao: temPeriodo(periodo)
        ? 'Adotantes com cadastro ou devolução no período.'
        : 'Todos os adotantes ativos.',
      itens: fichas,
      vazio: 'Nenhum adotante atende aos filtros informados.',
    },
  };
}
