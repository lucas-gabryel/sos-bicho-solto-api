import {
  EspecieAnimal,
  MotivoSaidaAnimal,
  SexoAnimal,
  StatusAnimal,
  TipoEventoAnimal,
} from '@prisma/client';
import {
  DocumentoRelatorio,
  FichaRelatorio,
  SecaoRelatorio,
} from '../pdf/documento-relatorio';
import {
  AdocaoRelatorio,
  AnimalRelatorio,
} from '../repositories/relatorios.repository.interface';
import {
  ESPECIE_LABEL,
  MOTIVO_SAIDA_LABEL,
  PORTE_LABEL,
  Periodo,
  SEXO_LABEL,
  STATUS_LABEL,
  TIPO_EVENTO_LABEL,
  descreverPeriodo,
  diasEntre,
  formatarData,
  formatarDuracao,
  formatarPercentual,
  formatarPeso,
  introducaoPeriodo,
  juntarLista,
  media,
  noPeriodo,
  plural,
  temPeriodo,
} from '../utils/formatacao.util';

export const LIMITE_LONGA_PERMANENCIA_DIAS = 90;

export interface FiltrosRelatorioAnimais extends Periodo {
  status?: StatusAnimal;
  especie?: EspecieAnimal;
}

export interface MetadadosRelatorio {
  geradoEm: Date;
  geradoPor: string;
}

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

function teveAtividade(animal: AnimalRelatorio, periodo: Periodo): boolean {
  if (!temPeriodo(periodo)) return true;
  return (
    noPeriodo(animal.criadoEm, periodo) ||
    animal.eventos.some((e) => noPeriodo(e.dataEvento, periodo)) ||
    animal.adocoes.some(
      (a) =>
        noPeriodo(a.dataAdocao, periodo) || noPeriodo(a.devolvidoEm, periodo),
    )
  );
}

function sufixoGenero(sexo: SexoAnimal): string {
  return sexo === SexoAnimal.FEMEA ? 'a' : 'o';
}

function simNao(valor: boolean): string {
  return valor ? 'sim' : 'não';
}

function descreverSituacao(animal: AnimalRelatorio, agora: Date): string {
  const o = sufixoGenero(animal.sexo);

  if (animal.status === StatusAnimal.ACOLHIMENTO) {
    const desde = inicioDoAcolhimento(
      entradasDoAnimal(animal),
      animal.criadoEm,
      agora,
    );
    return `Encontra-se em acolhimento há ${formatarDuracao(diasEntre(desde, agora))} (desde ${formatarData(desde)}).`;
  }

  if (animal.status === StatusAnimal.ADOTADO) {
    const ativa = animal.adocoes.find((a) => !a.devolvidoEm);
    if (!ativa) {
      return animal.tutor
        ? `Adotad${o} por ${animal.tutor.nome} (cadastro #${animal.tutor.codigo}).`
        : `Adotad${o}.`;
    }
    return (
      `Adotad${o} em ${formatarData(ativa.dataAdocao)} por ${ativa.tutor.nome} ` +
      `(cadastro #${ativa.tutor.codigo}), após ${formatarDuracao(diasAteAdocao(ativa))} em acolhimento; ` +
      `está com a família há ${formatarDuracao(diasEntre(ativa.dataAdocao, agora))}.`
    );
  }

  const motivo =
    animal.status === StatusAnimal.OBITO
      ? MotivoSaidaAnimal.OBITO
      : MotivoSaidaAnimal.TRANSFERENCIA;
  const saida = [...animal.eventos]
    .reverse()
    .find((e) => e.tipo === TipoEventoAnimal.SAIDA && e.motivoSaida === motivo);
  const quando = saida ? ` em ${formatarData(saida.dataEvento)}` : '';

  return animal.status === StatusAnimal.OBITO
    ? `Teve óbito registrado${quando}.`
    : `Saiu da ONG por transferência${quando}.`;
}

function montarFicha(animal: AnimalRelatorio, agora: Date): FichaRelatorio {
  const o = sufixoGenero(animal.sexo);
  const caracteristicas = [
    `${ESPECIE_LABEL[animal.especie]} ${SEXO_LABEL[animal.sexo].toLowerCase()}`,
    `raça ${animal.raca}`,
    ...(animal.porte ? [`porte ${PORTE_LABEL[animal.porte]}`] : []),
    `pelagem ${animal.cor.toLowerCase()}`,
    ...(animal.dataNascimento
      ? [
          `com cerca de ${formatarDuracao(diasEntre(animal.dataNascimento, agora))} de idade`,
        ]
      : []),
  ];

  const apresentacao =
    `${juntarLista(caracteristicas)}. Resgatad${o} em ${animal.localResgate} ` +
    `e registrad${o} na ONG em ${formatarData(animal.criadoEm)}. ` +
    descreverSituacao(animal, agora);

  let peso = `Peso inicial de ${formatarPeso(animal.pesoInicial)}`;
  if (animal.pesoAtual !== null) {
    const variacao = animal.pesoAtual - animal.pesoInicial;
    const sinal = variacao > 0 ? '+' : variacao < 0 ? '-' : '';
    peso += `; peso atual de ${formatarPeso(animal.pesoAtual)} (variação de ${sinal}${formatarPeso(Math.abs(variacao))})`;
  }
  const saude = `Castrad${o}: ${simNao(animal.castrado)}. Vacinad${o}: ${simNao(animal.vacinado)}. ${peso}.`;

  const devolucoes = animal.adocoes.filter((a) => a.devolvidoEm).length;
  const registrosSaude = animal.eventos.filter(
    (e) => e.tipo === TipoEventoAnimal.MEDICO,
  ).length;
  const historico =
    `Histórico: ${plural(animal.adocoes.length, 'adoção', 'adoções')}, ` +
    `${plural(devolucoes, 'devolução', 'devoluções')} e ` +
    `${plural(registrosSaude, 'registro de saúde', 'registros de saúde')}.`;

  const paragrafos = [apresentacao, saude, historico];
  if (animal.observacoes?.trim()) {
    paragrafos.push(`Observações: ${animal.observacoes.trim()}`);
  }

  return {
    titulo: `${animal.nome} · Registro ${animal.numeroRegistro}`,
    subtitulo: `${ESPECIE_LABEL[animal.especie]} · ${SEXO_LABEL[animal.sexo]} · ${animal.raca} · ${STATUS_LABEL[animal.status]}`,
    paragrafos,
    tabelas: [
      {
        titulo: 'Linha do tempo',
        colunas: ['Data', 'Tipo', 'Descrição', 'Registrado por'],
        larguras: [52, 70, '*', 80],
        linhas: animal.eventos.map((e) => [
          formatarData(e.dataEvento),
          e.motivoSaida
            ? `${TIPO_EVENTO_LABEL[e.tipo]} (${MOTIVO_SAIDA_LABEL[e.motivoSaida]})`
            : TIPO_EVENTO_LABEL[e.tipo],
          e.descricao,
          e.registradoPor ?? '-',
        ]),
        vazio: 'Nenhum evento registrado para este animal.',
      },
    ],
  };
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

  const totalEmAcolhimento = emAcolhimento.length;
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

  // Seções
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

  const secoes: SecaoRelatorio[] = [
    {
      titulo: 'Situação atual dos animais',
      descricao:
        'Posição na data de emissão, considerando todos os animais ativos no cadastro.',
      tabelas: [
        {
          colunas: ['Situação', 'Cães', 'Gatos', 'Total'],
          larguras: ['*', 60, 60, 60],
          linhas: linhasSituacao,
          vazio: 'Nenhum animal cadastrado.',
        },
        {
          titulo: 'Cuidados veterinários dos animais em acolhimento',
          colunas: ['Indicador', 'Animais', 'Percentual'],
          larguras: ['*', 60, 70],
          linhas:
            totalEmAcolhimento === 0
              ? []
              : [
                  [
                    'Castrados',
                    `${castrados}`,
                    formatarPercentual(castrados, totalEmAcolhimento),
                  ],
                  [
                    'Vacinados',
                    `${vacinados}`,
                    formatarPercentual(vacinados, totalEmAcolhimento),
                  ],
                  [
                    'Castrados e vacinados',
                    `${castradosEVacinados}`,
                    formatarPercentual(castradosEVacinados, totalEmAcolhimento),
                  ],
                  [
                    'Aguardando castração',
                    `${totalEmAcolhimento - castrados}`,
                    formatarPercentual(
                      totalEmAcolhimento - castrados,
                      totalEmAcolhimento,
                    ),
                  ],
                  [
                    'Aguardando vacinação',
                    `${totalEmAcolhimento - vacinados}`,
                    formatarPercentual(
                      totalEmAcolhimento - vacinados,
                      totalEmAcolhimento,
                    ),
                  ],
                ],
          vazio: 'Nenhum animal em acolhimento na data de emissão.',
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
      titulo: `Animais há mais de ${LIMITE_LONGA_PERMANENCIA_DIAS} dias em acolhimento`,
      descricao:
        'Animais que estão há mais tempo aguardando um lar e devem ter prioridade nas ações de divulgação e feiras de adoção.',
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
  ];

  const fichas = animais
    .filter((a) => !filtros.status || a.status === filtros.status)
    .filter((a) => teveAtividade(a, periodo))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((a) => montarFicha(a, agora));

  return {
    titulo: 'Relatório Histórico de Animais',
    finalidade:
      'Consolida as entradas, adoções, devoluções, saídas e cuidados de saúde dos animais acolhidos pela ONG, ' +
      'com a ficha histórica de cada animal, para apoiar a gestão e a prestação de contas à sociedade.',
    geradoEm: meta.geradoEm,
    geradoPor: meta.geradoPor,
    filtros: [
      { rotulo: 'Período', valor: descreverPeriodo(periodo) },
      {
        rotulo: 'Espécie',
        valor: filtros.especie ? ESPECIE_LABEL[filtros.especie] : 'Todas',
      },
      {
        rotulo: 'Situação (fichas)',
        valor: filtros.status ? STATUS_LABEL[filtros.status] : 'Todas',
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
        rotulo: 'Castrados / vacinados',
        valor: `${formatarPercentual(castrados, totalEmAcolhimento)} / ${formatarPercentual(vacinados, totalEmAcolhimento)}`,
        detalhe: 'dos animais em acolhimento',
      },
      {
        rotulo: 'Registros de saúde',
        valor: `${registrosSaude}`,
        detalhe: 'no período',
      },
    ],
    resumo,
    secoes,
    fichas: {
      titulo: 'Fichas históricas dos animais',
      descricao: temPeriodo(periodo)
        ? 'Animais com alguma movimentação no período (entrada, adoção, devolução ou atualização de histórico), com a linha do tempo completa.'
        : 'Todos os animais cadastrados, com a linha do tempo completa.',
      itens: fichas,
      vazio: 'Nenhum animal atende aos filtros informados.',
    },
  };
}
