import { Injectable } from '@nestjs/common';
import { PrismaService } from '#src/database/prisma.service';
import { Animal, FotoAnimal, Prisma } from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';
import {
  IAnimaisRepository,
  ListarAnimaisParams,
} from './animais.repository.interface';

@Injectable()
export class AnimaisPrismaRepository implements IAnimaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(
    dto: CriarAnimalDto,
    criadoPorId: string,
  ): Promise<Animal & { fotos: FotoAnimal[] }> {
    const hoje = new Date();
    const dd = String(hoje.getDate()).padStart(2, '0');
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const aaaa = hoje.getFullYear();
    const prefixo = `${dd}.${mm}.${aaaa}`;
    const countHoje = await this.prisma.animal.count({
      where: { numeroRegistro: { startsWith: prefixo } },
    });
    const numeroRegistro = `${prefixo}.${countHoje + 1}`;

    return this.prisma.$transaction(async (tx) => {
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

      const result = await tx.animal.findUniqueOrThrow({
        where: { id: animal.id },
        include: { fotos: { where: { ativo: true } } },
      });

      return result;
    });
  }

  async buscarPorId(
    id: string,
  ): Promise<(Animal & { fotos: FotoAnimal[] }) | null> {
    return this.prisma.animal.findUnique({
      where: { id },
      include: { fotos: { where: { ativo: true } } },
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

    return { data: data as (Animal & { fotos: FotoAnimal[] })[], total };
  }

  async atualizar(
    id: string,
    dto: AtualizarAnimalDto,
    modificadoPorId: string,
  ): Promise<Animal & { fotos: FotoAnimal[] }> {
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

    return this.prisma.animal.update({
      where: { id },
      data: updateData,
      include: { fotos: { where: { ativo: true } } },
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

      return tx.fotoAnimal.create({
        data: {
          animalId,
          url,
          principal,
          criadoPorId,
          modificadoPorId: criadoPorId,
        },
      });
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
}
