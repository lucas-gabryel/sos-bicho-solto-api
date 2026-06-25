import { Injectable } from '@nestjs/common';
import { Adocao, StatusAnimal } from '@prisma/client';
import { PrismaService } from '#src/database/prisma.service';
import {
  IAdocoesRepository,
  RegistrarAdocaoData,
  RegistrarDevolucaoData,
} from './adocoes.repository.interface';

class DevolucaoInvalidaError extends Error {}

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

  async devolver(data: RegistrarDevolucaoData): Promise<Adocao | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const adocaoAtualizada = await tx.adocao.updateMany({
          where: {
            id: data.id,
            devolvidoEm: null,
          },
          data: {
            devolvidoEm: new Date(),
            devolvidoPorId: data.devolvidoPorId,
            observacoesDevolucao: data.observacoesDevolucao,
          },
        });

        if (adocaoAtualizada.count === 0) {
          return null;
        }

        const animalAtualizado = await tx.animal.updateMany({
          where: {
            id: data.animalId,
            ativo: true,
            tutorId: data.tutorId,
            status: StatusAnimal.ADOTADO,
          },
          data: {
            tutorId: null,
            status: StatusAnimal.ACOLHIMENTO,
            modificadoPorId: data.devolvidoPorId,
          },
        });

        if (animalAtualizado.count === 0) {
          throw new DevolucaoInvalidaError();
        }

        return tx.adocao.findUniqueOrThrow({ where: { id: data.id } });
      });
    } catch (error) {
      if (error instanceof DevolucaoInvalidaError) {
        return null;
      }

      throw error;
    }
  }
}
