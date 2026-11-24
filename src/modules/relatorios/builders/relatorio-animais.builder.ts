import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import { DocumentoRelatorio } from '../pdf/documento-relatorio';
import { PALETA } from '../pdf/graficos';
import {
  AdocaoRelatorio,
  AnimalRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  ESPECIE_LABEL,
  MOTIVO_SAIDA_LABEL,
  Periodo,
  STATUS_LABEL,
  descreverPeriodo,
  diasEntre,
  formatarData,
  formatarDuracao,
  formatarPercentual,
  introducaoPeriodo,
  intervalosDoPeriodo,
  media,
  noPeriodo,
  plural,
  somarPorIntervalo,
} from '../utils/formatacao.util';

export const LIMITE_LONGA_PERMANENCIA_DIAS = 90;

export interface FiltrosRelatorioAnimais extends Periodo {
  especie?: EspecieAnimal;
}

export interface MetadadosRelatorio {
  geradoEm: Date;
  geradoPor: string;
}

export const COR_STATUS: Record<StatusAnimal, string> = {
  ACOLHIMENTO: PALETA.ambar,
  ADOTADO: PALETA.verde,
  TRANSFERIDO: PALETA.azul,
  OBITO: PALETA.cinza,
};

// Início do acolhimento vigente em `referencia`: a última entrada (resgate ou
// retorno por devolução) até aquela data. Sem eventos, vale o cadastro.
export function inicioDoAcolhimento(
  entradas: Date[],
  criadoEm: Date,
  referencia: Date,
): Date {
  const anteriores = entradas
    .filter((data) => data <= referencia)
    .map((data) => data.getTime());
  return anteriores.length ? new Date(Math.max(...anteriores)) : criadoEm;
}

export function diasAteAdocao(adocao: AdocaoRelatorio): number {
  const inicio = inicioDoAcolhimento(
    adocao.animal.entradas,
    adocao.animal.criadoEm,
    adocao.dataAdocao,
  );
  return diasEntre(inicio, adocao.dataAdocao);
}

function porData<T>(data: (item: T) => Date | null) {
  return (a: T, b: T) => (data(a)?.getTime() ?? 0) - (data(b)?.getTime() ?? 0);
}

function entradasDoAnimal(animal: AnimalRelatorio): Date[] {
  return animal.eventos
    .filter((e) => e.tipo === TipoEventoAnimal.ENTRADA)
    .map((e) => e.dataEvento);
}

function contarPorEspecie(especies: EspecieAnimal[]) {
  return {
    caes: especies.filter((e) => e === EspecieAnimal.CAO).length,
    gatos: especies.filter((e) => e === EspecieAnimal.GATO).length,
  };
}

function descreverEspecies(especies: EspecieAnimal[]): string {
  const { caes, gatos } = contarPorEspecie(especies);
  return `${plural(caes, 'cão', 'cães')} e ${plural(gatos, 'gato', 'gatos')}`;
}

function simNao(valor: boolean): string {
  return valor ? 'sim' : 'não';
}

export function montarRelatorioAnimais(
  animais: AnimalRelatorio[],
  filtros: FiltrosRelatorioAnimais,
  meta: MetadadosRelatorio,
): DocumentoRelatorio {
  const agora = meta.geradoEm;
  const periodo: Periodo = { de: filtros.de, ate: filtros.ate };

  // Movimentações do período, em ordem cronológica
  const todasAdocoes = animais.flatMap((a) => a.adocoes);
  const entradas = animais
    .filter((a) => noPeriodo(a.criadoEm, periodo))
    .sort(porData((a) => a.criadoEm));
  const adocoes = todasAdocoes
    .filter((a) => noPeriodo(a.dataAdocao, periodo))
    .sort(porData((a) => a.dataAdocao));
  const devolucoes = todasAdocoes
    .filter((a) => noPeriodo(a.devolvidoEm, periodo))
    .sort(porData((a) => a.devolvidoEm));
  const saidas = animais
    .flatMap((animal) =>
      animal.eventos
        .filter(
          (e) =>
            e.tipo === TipoEventoAnimal.SAIDA &&
            (e.motivoSaida === MotivoSaidaAnimal.TRANSFERENCIA ||
              e.motivoSaida === MotivoSaidaAnimal.OBITO) &&
            noPeriodo(e.dataEvento, periodo),
        )
        .map((evento) => ({ animal, evento })),
    )
    .sort(porData((s) => s.evento.dataEvento));
  const transferencias = saidas.filter(
    (s) => s.evento.motivoSaida === MotivoSaidaAnimal.TRANSFERENCIA,
  ).length;
  const obitos = saidas.length - transferencias;
  const registrosSaude = animais
    .flatMap((a) => a.eventos)
    .filter(
      (e) =>
        e.tipo === TipoEventoAnimal.MEDICO && noPeriodo(e.dataEvento, periodo),
    ).length;
  const mediaAteAdocao = media(adocoes.map(diasAteAdocao));

  // Situação atual (data de emissão)
  const emAcolhimento = animais
    .filter((a) => a.status === StatusAnimal.ACOLHIMENTO)
    .map((animal) => {
      const desde = inicioDoAcolhimento(
        entradasDoAnimal(animal),
        animal.criadoEm,
        agora,
      );
      return { animal, desde, dias: diasEntre(desde, agora) };
    });
  const totalEmAcolhimento = emAcolhimento.length;
  const mediaPermanencia = media(emAcolhimento.map((a) => a.dias));
  const castrados = emAcolhimento.filter((a) => a.animal.castrado).length;
  const vacinados = emAcolhimento.filter((a) => a.animal.vacinado).length;
  const castradosEVacinados = emAcolhimento.filter(
    (a) => a.animal.castrado && a.animal.vacinado,
  ).length;
  const longaPermanencia = emAcolhimento
    .filter((a) => a.dias >= LIMITE_LONGA_PERMANENCIA_DIAS)
    .sort((a, b) => b.dias - a.dias);
  const comTutor = animais.filter(
    (a) => a.status === StatusAnimal.ADOTADO,
  ).length;
  const especiesAcolhidas = emAcolhimento.map((a) => a.animal.especie);

  // Resumo descritivo
  const resumo: string[] = [];

  let movimento =
    `${introducaoPeriodo(periodo)}, a ONG registrou ${plural(entradas.length, 'entrada', 'entradas')} ` +
    `de animais resgatados (${descreverEspecies(entradas.map((a) => a.especie))}) ` +
    `e concluiu ${plural(adocoes.length, 'adoção', 'adoções')}.`;
  if (devolucoes.length === 0) {
    movimento += ' Não houve devoluções.';
  } else {
    movimento += ` Houve ${plural(devolucoes.length, 'devolução', 'devoluções')}`;
    movimento +=
      adocoes.length > 0
        ? ` (equivalente a ${formatarPercentual(devolucoes.length, adocoes.length)} das adoções do mesmo período).`
        : '.';
  }
  if (transferencias > 0 || obitos > 0) {
    movimento += ` Também foram registradas ${plural(transferencias, 'transferência', 'transferências')} e ${plural(obitos, 'óbito', 'óbitos')}.`;
  }
  movimento += ` Foram lançados ${plural(registrosSaude, 'registro de saúde', 'registros de saúde')} (consultas, vacinas, castrações e atualizações de peso).`;
  resumo.push(movimento);

  if (totalEmAcolhimento === 0) {
    resumo.push('Na data de emissão, não há animais em acolhimento na ONG.');
  } else {
    let atual =
      `Na data de emissão, a ONG mantém ${plural(totalEmAcolhimento, 'animal', 'animais')} em acolhimento ` +
      `(${descreverEspecies(especiesAcolhidas)}), dos quais ${formatarPercentual(castrados, totalEmAcolhimento)} estão castrados ` +
      `e ${formatarPercentual(vacinados, totalEmAcolhimento)} vacinados. ` +
      `O tempo médio de permanência em acolhimento é de ${formatarDuracao(mediaPermanencia ?? 0)}.`;
    if (longaPermanencia.length > 0) {
      atual += ` ${plural(longaPermanencia.length, 'animal está', 'animais estão')} há mais de ${LIMITE_LONGA_PERMANENCIA_DIAS} dias aguardando adoção e merecem prioridade na divulgação.`;
    }
    resumo.push(atual);
  }

  let adocaoTexto = `Atualmente, ${plural(comTutor, 'animal resgatado segue', 'animais resgatados seguem')} com tutores.`;
  if (mediaAteAdocao !== null) {
    adocaoTexto =
      `Os animais adotados no período permaneceram, em média, ${formatarDuracao(mediaAteAdocao)} sob cuidados da ONG até a adoção. ` +
      adocaoTexto;
  }
  resumo.push(adocaoTexto);

  // Evolução no período
  const intervalos = intervalosDoPeriodo(
    periodo,
    [
      ...animais.map((a) => a.criadoEm),
      ...todasAdocoes.map((a) => a.dataAdocao),
    ],
    agora,
  );

  // Situação atual por espécie
  const linhasSituacao = Object.values(StatusAnimal).map((status) => {
    const { caes, gatos } = contarPorEspecie(
      animais.filter((a) => a.status === status).map((a) => a.especie),
    );
    return [STATUS_LABEL[status], `${caes}`, `${gatos}`, `${caes + gatos}`];
  });
  const totais = contarPorEspecie(animais.map((a) => a.especie));
  linhasSituacao.push([
    'Total',
    `${totais.caes}`,
    `${totais.gatos}`,
    `${animais.length}`,
  ]);

  const percentualAcolhidos = (parte: number) =>
    totalEmAcolhimento === 0 ? 0 : parte / totalEmAcolhimento;

  return {
    titulo: 'Relatório de Animais',
    finalidade:
      'Entradas, adoções, devoluções, saídas e cuidados de saúde dos animais acolhidos pela ONG no período.',
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    periodo: descreverPeriodo(periodo),
    filtros: [
      {
        rotulo: 'Espécie',
        valor: filtros.especie ? ESPECIE_LABEL[filtros.especie] : 'Todas',
      },
    ],
    indicadores: [
      {
        rotulo: 'Entradas no período',
        valor: `${entradas.length}`,
        detalhe: descreverEspecies(entradas.map((a) => a.especie)),
      },
      {
        rotulo: 'Adoções no período',
        valor: `${adocoes.length}`,
        detalhe:
          mediaAteAdocao === null
            ? 'sem adoções no período'
            : `média de ${formatarDuracao(mediaAteAdocao)} até a adoção`,
      },
      {
        rotulo: 'Devoluções no período',
        valor: `${devolucoes.length}`,
        detalhe:
          adocoes.length > 0
            ? `${formatarPercentual(devolucoes.length, adocoes.length)} das adoções`
            : undefined,
      },
      {
        rotulo: 'Transferências / óbitos',
        valor: `${transferencias} / ${obitos}`,
        detalhe: 'no período',
      },
      {
        rotulo: 'Em acolhimento hoje',
        valor: `${totalEmAcolhimento}`,
        detalhe: descreverEspecies(especiesAcolhidas),
      },
      {
        rotulo: 'Permanência média',
        valor:
          mediaPermanencia === null ? '-' : formatarDuracao(mediaPermanencia),
        detalhe: 'dos animais em acolhimento',
      },
      {
        rotulo: 'Com tutores hoje',
        valor: `${comTutor}`,
        detalhe: 'animais adotados',
      },
      {
        rotulo: 'Registros de saúde',
        valor: `${registrosSaude}`,
        detalhe: 'no período',
      },
    ],
    resumo,
    secoes: [
      {
        titulo: 'Evolução no período',
        descricao: `Entradas, adoções e devoluções ao longo de ${descreverPeriodo(periodo).toLowerCase()}.`,
        graficos: [
          {
            tipo: 'colunas',
            titulo: 'Movimentação de animais',
            categorias: intervalos.map((i) => i.rotulo),
            series: [
              {
                nome: 'Entradas',
                cor: PALETA.laranja,
                valores: somarPorIntervalo(
                  intervalos,
                  entradas.map((a) => ({ data: a.criadoEm })),
                ),
              },
              {
                nome: 'Adoções',
                cor: PALETA.verde,
                valores: somarPorIntervalo(
                  intervalos,
                  adocoes.map((a) => ({ data: a.dataAdocao })),
                ),
              },
              {
                nome: 'Devoluções',
                cor: PALETA.cinza,
                valores: somarPorIntervalo(
                  intervalos,
                  devolucoes.map((a) => ({ data: a.devolvidoEm })),
                ),
              },
            ],
          },
        ],
      },
      {
        titulo: 'Situação atual',
        descricao:
          'Posição na data de emissão, considerando todos os animais ativos no cadastro.',
        graficos: [
          {
            tipo: 'rosca',
            titulo: 'Animais por situação',
            centro: { valor: `${animais.length}`, rotulo: 'animais' },
            fatias: Object.values(StatusAnimal).map((status) => ({
              rotulo: STATUS_LABEL[status],
              valor: animais.filter((a) => a.status === status).length,
              cor: COR_STATUS[status],
            })),
          },
          {
            tipo: 'progresso',
            titulo: 'Cuidados dos animais em acolhimento',
            vazio: 'Nenhum animal em acolhimento na data de emissão.',
            itens:
              totalEmAcolhimento === 0
                ? []
                : [
                    {
                      rotulo: 'Castrados',
                      percentual: percentualAcolhidos(castrados),
                      texto: `${castrados} de ${totalEmAcolhimento} · ${formatarPercentual(castrados, totalEmAcolhimento)}`,
                    },
                    {
                      rotulo: 'Vacinados',
                      percentual: percentualAcolhidos(vacinados),
                      texto: `${vacinados} de ${totalEmAcolhimento} · ${formatarPercentual(vacinados, totalEmAcolhimento)}`,
                    },
                    {
                      rotulo: 'Castrados e vacinados',
                      percentual: percentualAcolhidos(castradosEVacinados),
                      texto: `${castradosEVacinados} de ${totalEmAcolhimento} · ${formatarPercentual(castradosEVacinados, totalEmAcolhimento)}`,
                    },
                  ],
          },
        ],
        tabelas: [
          {
            titulo: 'Animais por situação e espécie',
            colunas: ['Situação', 'Cães', 'Gatos', 'Total'],
            larguras: ['*', 70, 70, 70],
            linhas: linhasSituacao,
            vazio: 'Nenhum animal cadastrado.',
          },
        ],
      },
      {
        titulo: 'Movimentações do período',
        descricao: `Período: ${descreverPeriodo(periodo)}.`,
        tabelas: [
          {
            titulo: 'Entradas (resgates)',
            colunas: [
              'Data',
              'Registro',
              'Animal',
              'Espécie',
              'Local de resgate',
            ],
            larguras: [52, 62, 80, 40, '*'],
            linhas: entradas.map((a) => [
              formatarData(a.criadoEm),
              a.numeroRegistro,
              a.nome,
              ESPECIE_LABEL[a.especie],
              a.localResgate,
            ]),
            vazio: 'Nenhuma entrada no período.',
          },
          {
            titulo: 'Adoções',
            colunas: [
              'Data',
              'Animal',
              'Tutor',
              'Protetor responsável',
              'Tempo em acolhimento',
            ],
            larguras: [52, 80, '*', 90, 70],
            linhas: adocoes.map((a) => [
              formatarData(a.dataAdocao),
              `${a.animal.nome} (${a.animal.numeroRegistro})`,
              `${a.tutor.nome} (#${a.tutor.codigo})`,
              a.protetor,
              formatarDuracao(diasAteAdocao(a)),
            ]),
            vazio: 'Nenhuma adoção no período.',
          },
          {
            titulo: 'Devoluções',
            colunas: [
              'Data',
              'Animal',
              'Tutor',
              'Tempo com o tutor',
              'Observações',
            ],
            larguras: [52, 80, 100, 60, '*'],
            linhas: devolucoes.map((a) => [
              formatarData(a.devolvidoEm),
              `${a.animal.nome} (${a.animal.numeroRegistro})`,
              `${a.tutor.nome} (#${a.tutor.codigo})`,
              formatarDuracao(diasEntre(a.dataAdocao, a.devolvidoEm ?? agora)),
              a.observacoesDevolucao?.trim() || '-',
            ]),
            vazio: 'Nenhuma devolução no período.',
          },
          {
            titulo: 'Transferências e óbitos',
            colunas: ['Data', 'Animal', 'Motivo', 'Descrição'],
            larguras: [52, 90, 70, '*'],
            linhas: saidas.map(({ animal, evento }) => [
              formatarData(evento.dataEvento),
              `${animal.nome} (${animal.numeroRegistro})`,
              evento.motivoSaida ? MOTIVO_SAIDA_LABEL[evento.motivoSaida] : '-',
              evento.descricao,
            ]),
            vazio: 'Nenhuma transferência ou óbito no período.',
          },
        ],
      },
      {
        titulo: 'Pontos de atenção',
        descricao: `Animais há mais de ${LIMITE_LONGA_PERMANENCIA_DIAS} dias em acolhimento: devem ter prioridade nas ações de divulgação e feiras de adoção.`,
        tabelas: [
          {
            colunas: [
              'Registro',
              'Animal',
              'Espécie',
              'Desde',
              'Tempo',
              'Castrado',
              'Vacinado',
            ],
            larguras: [62, '*', 40, 52, 55, 45, 45],
            linhas: longaPermanencia.map(({ animal, desde, dias }) => [
              animal.numeroRegistro,
              animal.nome,
              ESPECIE_LABEL[animal.especie],
              formatarData(desde),
              formatarDuracao(dias),
              simNao(animal.castrado),
              simNao(animal.vacinado),
            ]),
            vazio: `Nenhum animal em acolhimento há mais de ${LIMITE_LONGA_PERMANENCIA_DIAS} dias.`,
          },
        ],
      },
    ],
    notas: [
      'Movimentações (entradas, adoções, devoluções, transferências, óbitos e registros de saúde) consideram o período analisado; a situação atual refere-se à data de emissão.',
      'Entrada é a data de cadastro do animal resgatado na ONG; retornos por devolução aparecem como devoluções.',
      'O tempo em acolhimento é contado a partir da última entrada do animal (resgate ou retorno por devolução).',
      'Animais excluídos do cadastro não são considerados.',
    ],
  };
}
