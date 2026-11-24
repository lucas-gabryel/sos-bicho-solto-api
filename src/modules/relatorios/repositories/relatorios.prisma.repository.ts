import { Injectable } from '@nestjs/common';
import { EspecieAnimal, Prisma, TipoEventoAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import { SituacaoAcolhedor } from '#src/modules/tutores/enums/situacao-acolhedor.enum';
import {
  ANIMAIS_VINCULADOS_WHERE,
  filtroSituacao,
} from '#src/modules/tutores/repositories/filtro-situacao';
import {
  AcolhedorRelatorio,
  AdocaoRelatorio,
  AnimalRelatorio,
  IRelatoriosRepository,
} from './relatorios.repository.interface';

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
    observacoes: adocao.observacoes,
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
      include: {
        tutor: { select: { codigo: true, nome: true } },
        eventos: {
          where: { ativo: true },
          orderBy: { dataEvento: 'asc' },
          include: { criadoPor: { select: { nome: true } } },
        },
        adocoes: {
          orderBy: { dataAdocao: 'asc' },
          include: INCLUDE_ADOCAO,
        },
      },
    });

    return animais.map((animal) => ({
      numeroRegistro: animal.numeroRegistro,
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca,
      sexo: animal.sexo,
      porte: animal.porte,
      cor: animal.cor,
      pesoInicial: Number(animal.pesoInicial),
      pesoAtual: animal.pesoAtual === null ? null : Number(animal.pesoAtual),
      dataNascimento: animal.dataNascimento,
      castrado: animal.castrado,
      vacinado: animal.vacinado,
      localResgate: animal.localResgate,
      observacoes: animal.observacoes,
      status: animal.status,
      criadoEm: animal.criadoEm,
      tutor: animal.tutor,
      eventos: animal.eventos.map((evento) => ({
        dataEvento: evento.dataEvento,
        tipo: evento.tipo,
        motivoSaida: evento.motivoSaida,
        descricao: evento.descricao,
        automatico: evento.automatico,
        registradoPor: evento.criadoPor?.nome ?? null,
      })),
      adocoes: animal.adocoes.map(mapearAdocao),
    }));
  }

  async buscarAcolhedores(
    situacao: SituacaoAcolhedor,
  ): Promise<AcolhedorRelatorio[]> {
    const acolhedores = await this.prisma.tutor.findMany({
      where: { ativo: true, ...filtroSituacao(situacao) },
      orderBy: { nome: 'asc' },
      include: {
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
            raca: true,
            status: true,
          },
        },
      },
    });

    return acolhedores.map((acolhedor) => ({
      codigo: acolhedor.codigo,
      nome: acolhedor.nome,
      cpf: acolhedor.cpf,
      telefone: acolhedor.telefone,
      email: acolhedor.email,
      endereco: acolhedor.endereco,
      criadoEm: acolhedor.criadoEm,
      adocoes: acolhedor.adocoes.map(mapearAdocao),
      animaisVinculados: acolhedor.animais,
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
