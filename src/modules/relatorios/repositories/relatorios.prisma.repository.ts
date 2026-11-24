import { Injectable } from '@nestjs/common';
import { EspecieAnimal, Prisma, TipoEventoAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { ANIMAIS_VINCULADOS_WHERE } from '#src/modules/tutores/repositories/filtro-situacao';
import {
  AcolhedorRelatorio,
  AdocaoRelatorio,
  AnimalRelatorio,
  DoacaoRelatorio,
  IRelatoriosRepository,
  MovimentacaoEstoqueRelatorio,
} from './relatorios.repository.interface';

// Campos @db.Date chegam como meia-noite UTC (21h do dia anterior em
// Maceió); ancorar ao meio-dia local mantém o dia correto.
const MEIO_DIA_LOCAL_MS = 15 * 60 * 60 * 1000;

const INCLUDE_ADOCAO = {
  tutor: { select: { codigo: true, nome: true } },
  protetor: { select: { nome: true } },
  animal: {
    select: {
      nome: true,
      numeroRegistro: true,
      especie: true,
      criadoEm: true,
      eventos: {
        where: { ativo: true, tipo: TipoEventoAnimal.ENTRADA },
        select: { dataEvento: true },
      },
    },
  },
} satisfies Prisma.AdocaoInclude;

type AdocaoComRelacoes = Prisma.AdocaoGetPayload<{
  include: typeof INCLUDE_ADOCAO;
}>;

function mapearAdocao(adocao: AdocaoComRelacoes): AdocaoRelatorio {
  const { eventos, ...animal } = adocao.animal;
  return {
    dataAdocao: adocao.dataAdocao,
    devolvidoEm: adocao.devolvidoEm,
    observacoesDevolucao: adocao.observacoesDevolucao,
    protetor: adocao.protetor.nome,
    tutor: adocao.tutor,
    animal: { ...animal, entradas: eventos.map((e) => e.dataEvento) },
  };
}

@Injectable()
export class RelatoriosPrismaRepository implements IRelatoriosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarAnimais(especie?: EspecieAnimal): Promise<AnimalRelatorio[]> {
    const animais = await this.prisma.animal.findMany({
      where: { ativo: true, ...(especie && { especie }) },
      orderBy: { criadoEm: 'asc' },
      select: {
        numeroRegistro: true,
        nome: true,
        especie: true,
        castrado: true,
        vacinado: true,
        localResgate: true,
        status: true,
        criadoEm: true,
        eventos: {
          where: { ativo: true },
          orderBy: { dataEvento: 'asc' },
          select: {
            dataEvento: true,
            tipo: true,
            motivoSaida: true,
            descricao: true,
          },
        },
        adocoes: {
          orderBy: { dataAdocao: 'asc' },
          include: INCLUDE_ADOCAO,
        },
      },
    });

    return animais.map((animal) => ({
      ...animal,
      adocoes: animal.adocoes.map(mapearAdocao),
    }));
  }

  async buscarAcolhedores(): Promise<AcolhedorRelatorio[]> {
    const acolhedores = await this.prisma.tutor.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: {
        codigo: true,
        nome: true,
        telefone: true,
        criadoEm: true,
        adocoes: {
          where: { animal: { ativo: true } },
          orderBy: { dataAdocao: 'asc' },
          include: INCLUDE_ADOCAO,
        },
        animais: {
          where: ANIMAIS_VINCULADOS_WHERE,
          orderBy: { nome: 'asc' },
          select: {
            numeroRegistro: true,
            nome: true,
            especie: true,
            status: true,
          },
        },
      },
    });

    return acolhedores.map(({ animais, adocoes, ...acolhedor }) => ({
      ...acolhedor,
      adocoes: adocoes.map(mapearAdocao),
      animaisVinculados: animais,
    }));
  }

  async buscarDoacoes(): Promise<DoacaoRelatorio[]> {
    const doacoes = await this.prisma.doacao.findMany({
      where: { ativo: true },
      orderBy: { dataRecebimento: 'asc' },
      include: { doador: { select: { id: true, nomeRazaoSocial: true } } },
    });

    return doacoes.map((doacao) => ({
      tipo: doacao.tipo,
      valor: doacao.valor === null ? null : Number(doacao.valor),
      quantidade: doacao.quantidade === null ? null : Number(doacao.quantidade),
      unidadeMedida: doacao.unidadeMedida,
      descricao: doacao.descricao,
      dataRecebimento: new Date(
        doacao.dataRecebimento.getTime() + MEIO_DIA_LOCAL_MS,
      ),
      doador: doacao.doador
        ? { id: doacao.doador.id, nome: doacao.doador.nomeRazaoSocial }
        : null,
    }));
  }

  async buscarMovimentacoesEstoque(): Promise<MovimentacaoEstoqueRelatorio[]> {
    const movimentacoes = await this.prisma.movimentacaoEstoque.findMany({
      where: { ativo: true },
      orderBy: [{ dataMovimento: 'asc' }, { criadoEm: 'asc' }, { id: 'asc' }],
      select: {
        tipo: true,
        tipoItem: true,
        descricaoItem: true,
        quantidade: true,
        unidadeMedida: true,
        dataMovimento: true,
      },
    });

    return movimentacoes.map((m) => ({
      ...m,
      quantidade: Number(m.quantidade),
    }));
  }

  async buscarNomeUsuario(id: string): Promise<string | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { nome: true },
    });
    return usuario?.nome ?? null;
  }
}
