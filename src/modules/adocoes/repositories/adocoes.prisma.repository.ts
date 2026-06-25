import { Injectable } from '@nestjs/common';
import { Adocao, StatusAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  IAdocoesRepository,
  RegistrarAdocaoData,
  RegistrarDevolucaoData,
} from './adocoes.repository.interface';

@Injectable()
export class AdocoesPrismaRepository implements IAdocoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorId(id: string): Promise<Adocao | null> {
    return this.prisma.adocao.findUnique({ where: { id } });
  }

  buscarAtivaPorAnimalId(animalId: string): Promise<Adocao | null> {
    return this.prisma.adocao.findFirst({
      where: {
        animalId,
        devolvidoEm: null,
      },
      orderBy: { dataAdocao: 'desc' },
    });
  }

  registrar(data: RegistrarAdocaoData): Promise<Adocao | null> {
    return this.prisma.$transaction(async (tx) => {
      const animalAtualizado = await tx.animal.updateMany({
        where: {
          id: data.animalId,
          ativo: true,
          tutorId: null,
          status: StatusAnimal.ACOLHIMENTO,
        },
        data: {
          tutorId: data.tutorId,
          status: StatusAnimal.ADOTADO,
          modificadoPorId: data.protetorId,
        },
      });

      if (animalAtualizado.count === 0) {
        return null;
      }

      return tx.adocao.create({
        data: {
          animalId: data.animalId,
          tutorId: data.tutorId,
          protetorId: data.protetorId,
          observacoes: data.observacoes,
        },
      });
    });
  }

  devolver(data: RegistrarDevolucaoData): Promise<Adocao> {
    return this.prisma.$transaction(async (tx) => {
      const adocao = await tx.adocao.update({
        where: { id: data.id },
        data: {
          devolvidoEm: new Date(),
          devolvidoPorId: data.devolvidoPorId,
          observacoesDevolucao: data.observacoesDevolucao,
        },
      });

      await tx.animal.update({
        where: { id: data.animalId },
        data: {
          tutorId: null,
          status: StatusAnimal.ACOLHIMENTO,
          modificadoPorId: data.devolvidoPorId,
        },
      });

      return adocao;
    });
  }
}
