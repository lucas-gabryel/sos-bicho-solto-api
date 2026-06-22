import { Injectable } from '@nestjs/common';
import { PrismaService } from '#src/database/prisma.service';
import { Animal, EspecieAnimal, StatusAnimal, Prisma } from '@prisma/client';
import { CriarAnimalDto } from '../dto/criar-animal.dto';
import { AtualizarAnimalDto } from '../dto/atualizar-animal.dto';
import { IAnimaisRepository } from './animais.repository.interface';

@Injectable()
export class AnimaisPrismaRepository implements IAnimaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CriarAnimalDto): Promise<Animal> {
    const numeroRegistro = `ANIMAL-${Date.now()}`;

    const data: Prisma.AnimalCreateInput = {
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
    };

    return this.prisma.animal.create({ data });
  }

  async buscarPorId(id: string): Promise<Animal | null> {
    return this.prisma.animal.findUnique({
      where: { id },
    });
  }

  async listar(skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        skip,
        take,
        where: { ativo: true },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.animal.count({ where: { ativo: true } }),
    ]);

    return { data, total };
  }

  async atualizar(id: string, dto: AtualizarAnimalDto): Promise<Animal> {
    const updateData: Partial<Animal> = {};

    if (dto.nome !== undefined) updateData.nome = dto.nome;
    if (dto.especie !== undefined) updateData.especie = dto.especie;
    if (dto.raca !== undefined) updateData.raca = dto.raca;
    if (dto.sexo !== undefined) updateData.sexo = dto.sexo;
    if (dto.porte !== undefined) updateData.porte = dto.porte;
    if (dto.cor !== undefined) updateData.cor = dto.cor;
    if (dto.pesoInicial !== undefined)
      updateData.pesoInicial = new Prisma.Decimal(dto.pesoInicial);
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
    });
  }

  async excluir(id: string): Promise<Animal> {
    return this.prisma.animal.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async buscarPorEspecie(especie: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        skip,
        take,
        where: { especie: especie as EspecieAnimal, ativo: true },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.animal.count({
        where: { especie: especie as EspecieAnimal, ativo: true },
      }),
    ]);

    return { data, total };
  }

  async buscarPorStatus(status: string, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.animal.findMany({
        skip,
        take,
        where: { status: status as StatusAnimal, ativo: true },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.animal.count({
        where: { status: status as StatusAnimal, ativo: true },
      }),
    ]);

    return { data, total };
  }
}
