import { Injectable } from '@nestjs/common';
import { PrismaService } from '#src/database/prisma.service';
import { Animal, FotoAnimal, Prisma, TipoEventoAnimal } from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';
import { EventoAnimalComAutor } from '../dto/evento-animal-response.dto';
import { inferirTipoDocumentoPorUrl } from '../utils/documento-evento.util';
import {
  AnimalComRelacoes,
  CriarEventoAnimalData,
  IAnimaisRepository,
  ListarAnimaisParams,
  ListarEventosAnimalParams,
} from './animais.repository.interface';

const INCLUDE_AUTOR_EVENTO = {
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
} satisfies Prisma.EventoAnimalInclude;

const INCLUDE_DETALHE_ANIMAL = {
  fotos: { where: { ativo: true } },
  eventos: {
    where: { ativo: true },
    orderBy: [{ dataEvento: 'desc' }, { criadoEm: 'desc' }],
    include: INCLUDE_AUTOR_EVENTO,
  },
} satisfies Prisma.AnimalInclude;

@Injectable()
export class AnimaisPrismaRepository implements IAnimaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(
    dto: CriarAnimalDto,
    criadoPorId: string,
  ): Promise<AnimalComRelacoes> {
    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, '0');
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const aaaa = hoje.getFullYear();
    const prefixo = `${dd}.${mm}.${aaaa}`;

    return this.prisma.$transaction(async (tx) => {
      const countHoje = await tx.animal.count({
        where: { numeroRegistro: { startsWith: prefixo } },
      });
      const numeroRegistro = `${prefixo}.${countHoje + 1}`;

      const animal = await tx.animal.create({
        data: {
          numeroRegistro,
          nome: dto.nome,
          especie: dto.especie,
          raca: dto.raca,
          sexo: dto.sexo,
          porte: dto.porte,
          cor: dto.cor,
          pesoInicial: new Prisma.Decimal(dto.pesoInicial),
          castrado: dto.castrado ?? false,
          vacinado: dto.vacinado ?? false,
          localResgate: dto.localResgate,
          observacoes: dto.observacoes,
          dataNascimento: dto.dataNascimento,
          criadoPorId,
          modificadoPorId: criadoPorId,
        },
      });

      if (dto.fotos && dto.fotos.length > 0) {
        await tx.fotoAnimal.createMany({
          data: dto.fotos.map((f) => ({
            animalId: animal.id,
            url: f.url,
            principal: f.principal,
            criadoPorId,
            modificadoPorId: criadoPorId,
          })),
        });
      }

      const fotoPrincipal =
        dto.fotos?.find((f) => f.principal) ?? dto.fotos?.[0];
      const fotosExtras = (dto.fotos ?? []).filter((f) => f !== fotoPrincipal);

      const eventosIniciais: Prisma.EventoAnimalCreateManyInput[] = [
        {
          animalId: animal.id,
          tipo: TipoEventoAnimal.ENTRADA,
          descricao: `Entrada na ONG — resgatado em: ${dto.localResgate}.`,
          dataEvento: animal.criadoEm,
          documentoUrl: fotoPrincipal?.url ?? null,
          documentoTipo: fotoPrincipal?.url
            ? (inferirTipoDocumentoPorUrl(fotoPrincipal.url) ?? 'image/jpeg')
            : null,
          automatico: true,
          criadoPorId,
        },
        {
          animalId: animal.id,
          tipo: TipoEventoAnimal.MEDICO,
          descricao: `Avaliação médica inicial: peso ${dto.pesoInicial} kg, ${
            dto.vacinado ? 'vacinado' : 'não vacinado'
          }, ${dto.castrado ? 'castrado' : 'não castrado'}${
            dto.observacoes?.trim()
              ? `. Observações: ${dto.observacoes.trim()}`
              : ''
          }.`,
          dataEvento: animal.criadoEm,
          automatico: true,
          criadoPorId,
        },
        ...fotosExtras.map((f) => ({
          animalId: animal.id,
          tipo: TipoEventoAnimal.FOTO,
          descricao: 'Foto registrada no cadastro inicial do animal.',
          dataEvento: animal.criadoEm,
          documentoUrl: f.url,
          documentoTipo: inferirTipoDocumentoPorUrl(f.url) ?? 'image/jpeg',
          automatico: true,
          criadoPorId,
        })),
      ];

      await tx.eventoAnimal.createMany({
        data: eventosIniciais,
      });

      const result = await tx.animal.findUniqueOrThrow({
        where: { id: animal.id },
        include: INCLUDE_DETALHE_ANIMAL,
      });

      return result;
    });
  }

  async buscarPorId(id: string): Promise<AnimalComRelacoes | null> {
    return this.prisma.animal.findUnique({
      where: { id },
      include: INCLUDE_DETALHE_ANIMAL,
    });
  }

  async listar(params: ListarAnimaisParams) {
    const where: Prisma.AnimalWhereInput = {
      ativo: true,
    };

    if (params.especie) {
      where.especie = params.especie;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.tutorId) {
      where.tutorId = params.tutorId;
    }

    if (params.busca) {
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { numeroRegistro: { contains: params.busca, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        skip: params.skip,
        take: params.take,
        where,
        include: { fotos: { where: { ativo: true } } },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.animal.count({ where }),
    ]);

    return { data: data as AnimalComRelacoes[], total };
  }

  async atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    modificadoPorId: string,
    eventosParaCriar: CriarEventoAnimalData[] = [],
  ): Promise<AnimalComRelacoes> {
    const updateData: Prisma.AnimalUpdateInput = {
      modificadoPorId,
    };

    if (dto.nome !== undefined) updateData.nome = dto.nome;
    if (dto.especie !== undefined) updateData.especie = dto.especie;
    if (dto.raca !== undefined) updateData.raca = dto.raca;
    if (dto.sexo !== undefined) updateData.sexo = dto.sexo;
    if (dto.porte !== undefined) updateData.porte = dto.porte;
    if (dto.cor !== undefined) updateData.cor = dto.cor;
    if (dto.pesoInicial !== undefined)
      updateData.pesoInicial = new Prisma.Decimal(dto.pesoInicial);
    if (dto.pesoAtual !== undefined)
      updateData.pesoAtual = new Prisma.Decimal(dto.pesoAtual);
    if (dto.castrado !== undefined) updateData.castrado = dto.castrado;
    if (dto.vacinado !== undefined) updateData.vacinado = dto.vacinado;
    if (dto.localResgate !== undefined)
      updateData.localResgate = dto.localResgate;
    if (dto.observacoes !== undefined) updateData.observacoes = dto.observacoes;
    if (dto.dataNascimento !== undefined)
      updateData.dataNascimento = dto.dataNascimento;
    if (dto.status !== undefined) updateData.status = dto.status;

    return this.prisma.$transaction(async (tx) => {
      await tx.animal.update({
        where: { id },
        data: updateData,
      });

      if (eventosParaCriar.length > 0) {
        await tx.eventoAnimal.createMany({
          data: eventosParaCriar.map((ev) => ({
            animalId: id,
            tipo: ev.tipo,
            motivoSaida: ev.motivoSaida ?? null,
            descricao: ev.descricao,
            dataEvento: ev.dataEvento ?? new Date(),
            documentoUrl: ev.documentoUrl ?? null,
            documentoNome: ev.documentoNome ?? null,
            documentoTipo: ev.documentoTipo ?? null,
            automatico: ev.automatico ?? false,
            criadoPorId: ev.criadoPorId ?? modificadoPorId,
          })),
        });
      }

      const result = await tx.animal.findUniqueOrThrow({
        where: { id },
        include: INCLUDE_DETALHE_ANIMAL,
      });

      return result;
    });
  }

  async excluir(id: string, modificadoPorId: string): Promise<Animal> {
    return this.prisma.animal.update({
      where: { id },
      data: { ativo: false, modificadoPorId },
    });
  }

  async adicionarFoto(
    animalId: string,
    url: string,
    principal: boolean,
    criadoPorId: string,
  ): Promise<FotoAnimal> {
    return this.prisma.$transaction(async (tx) => {
      if (principal) {
        await tx.fotoAnimal.updateMany({
          where: { animalId, principal: true },
          data: { principal: false, modificadoPorId: criadoPorId },
        });
      }

      const foto = await tx.fotoAnimal.create({
        data: {
          animalId,
          url,
          principal,
          criadoPorId,
          modificadoPorId: criadoPorId,
        },
      });

      await tx.eventoAnimal.create({
        data: {
          animalId,
          tipo: TipoEventoAnimal.FOTO,
          descricao: principal
            ? 'Nova foto adicionada e definida como foto principal do animal.'
            : 'Nova foto adicionada ao histórico do animal.',
          dataEvento: foto.criadoEm,
          documentoUrl: url,
          documentoTipo: inferirTipoDocumentoPorUrl(url) ?? 'image/jpeg',
          automatico: true,
          criadoPorId,
        },
      });

      return foto;
    });
  }

  async removerFoto(
    fotoId: string,
    modificadoPorId: string,
  ): Promise<FotoAnimal> {
    return this.prisma.fotoAnimal.update({
      where: { id: fotoId },
      data: { ativo: false, modificadoPorId },
    });
  }

  async definirFotoPrincipal(
    animalId: string,
    fotoId: string,
    modificadoPorId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.fotoAnimal.updateMany({
        where: { animalId, principal: true },
        data: { principal: false, modificadoPorId },
      });

      await tx.fotoAnimal.update({
        where: { id: fotoId },
        data: { principal: true, modificadoPorId },
      });
    });
  }

  async buscarFotoPorId(fotoId: string): Promise<FotoAnimal | null> {
    return this.prisma.fotoAnimal.findUnique({
      where: { id: fotoId },
    });
  }

  async adicionarEvento(
    animalId: string,
    data: CriarEventoAnimalData,
  ): Promise<EventoAnimalComAutor> {
    return this.prisma.$transaction(async (tx) => {
      if (data.novoStatusAnimal) {
        await tx.animal.update({
          where: { id: animalId },
          data: {
            status: data.novoStatusAnimal,
            modificadoPorId: data.criadoPorId ?? undefined,
          },
        });
      }

      const evento = await tx.eventoAnimal.create({
        data: {
          animalId,
          tipo: data.tipo,
          motivoSaida: data.motivoSaida ?? null,
          descricao: data.descricao,
          dataEvento: data.dataEvento ?? new Date(),
          documentoUrl: data.documentoUrl ?? null,
          documentoNome: data.documentoNome ?? null,
          documentoTipo: data.documentoTipo ?? null,
          automatico: data.automatico ?? false,
          criadoPorId: data.criadoPorId ?? null,
        },
        include: INCLUDE_AUTOR_EVENTO,
      });

      return evento;
    });
  }

  async listarEventos(params: ListarEventosAnimalParams): Promise<{
    data: EventoAnimalComAutor[];
    total: number;
  }> {
    const where: Prisma.EventoAnimalWhereInput = {
      animalId: params.animalId,
      ativo: true,
      ...(params.tipo && { tipo: params.tipo }),
    };

    const [data, total] = await Promise.all([
      this.prisma.eventoAnimal.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ dataEvento: 'desc' }, { criadoEm: 'desc' }],
        include: INCLUDE_AUTOR_EVENTO,
      }),
      this.prisma.eventoAnimal.count({ where }),
    ]);

    return { data: data, total };
  }
}
