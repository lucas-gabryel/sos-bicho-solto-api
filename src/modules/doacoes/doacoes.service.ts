import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoDoacao } from '@prisma/client';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IDoadoresRepository } from '#src/modules/doadores/repositories/doadores.repository.interface';
import { DOADORES_REPOSITORY } from '#src/modules/doadores/repositories/doadores.repository.interface';
import { EstoqueService } from '#src/modules/estoque/estoque.service';
import { normalizarItemEstoque } from '#src/modules/estoque/utils/estoque.utils';
import { TipoMovimentacaoEstoque } from '@prisma/client';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import type { IDoacoesRepository } from './repositories/doacoes.repository.interface';
import { DOACOES_REPOSITORY } from './repositories/doacoes.repository.interface';

@Injectable()
export class DoacoesService {
  constructor(
    @Inject(DOACOES_REPOSITORY)
    private readonly doacoesRepository: IDoacoesRepository,
    @Inject(DOADORES_REPOSITORY)
    private readonly doadoresRepository: IDoadoresRepository,
    private readonly estoqueService: EstoqueService,
  ) {}

  async criar(
    dto: CriarDoacaoDto,
    usuario: JwtPayload,
  ): Promise<DoacaoResponseDto> {
    let doadorIdFinal: string | null = null;

    if (!dto.anonima) {
      if (!dto.doadorId) {
        throw new BadRequestException(
          'A seleção do doador é obrigatória quando a doação não for anônima.',
        );
      }

      const doador = await this.doadoresRepository.buscarPorId(dto.doadorId);
      if (!doador || !doador.ativo) {
        throw new NotFoundException('Doador não encontrado ou inativo.');
      }

      doadorIdFinal = doador.id;
    }

    let valorFinal: number | null = null;
    let quantidadeFinal: number | null = null;

    if (dto.tipo === TipoDoacao.DINHEIRO) {
      if (dto.valor === undefined || dto.valor === null || dto.valor <= 0) {
        throw new BadRequestException(
          'O valor monetário é obrigatório e deve ser maior que zero para doações em dinheiro.',
        );
      }
      valorFinal = Number(dto.valor);
    } else {
      if (
        dto.quantidade === undefined ||
        dto.quantidade === null ||
        dto.quantidade <= 0
      ) {
        throw new BadRequestException(
          'A quantidade é obrigatória e deve ser maior que zero para este tipo de doação.',
        );
      }
      quantidadeFinal = Number(dto.quantidade);
    }

    const partesData = dto.dataRecebimento.split('T')[0].split('-');
    const ano = Number(partesData[0]);
    const mes = Number(partesData[1]);
    const dia = Number(partesData[2]);

    const dataRecebimento = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
    if (
      Number.isNaN(dataRecebimento.getTime()) ||
      Number.isNaN(ano) ||
      Number.isNaN(mes) ||
      Number.isNaN(dia)
    ) {
      throw new BadRequestException('Data de recebimento inválida.');
    }

    return this.doacoesRepository.executarTransacao(async (tx) => {
      const doacao = await this.doacoesRepository.criar(
        {
          tipo: dto.tipo,
          valor: valorFinal,
          quantidade: quantidadeFinal,
          unidadeMedida: dto.unidadeMedida?.trim() || null,
          descricao: dto.descricao?.trim() || null,
          dataRecebimento,
          doadorId: doadorIdFinal,
          registradoPorId: usuario.sub,
        },
        tx,
      );

      if (dto.tipo !== TipoDoacao.DINHEIRO && quantidadeFinal && quantidadeFinal > 0) {
        const {
          descricaoItem: descFormatada,
          unidadeMedida: unFormatada,
        } = normalizarItemEstoque(
          dto.descricao?.trim() || `Item de ${dto.tipo}`,
          dto.unidadeMedida,
        );

        await this.estoqueService.registrarMovimentacao(
          {
            tipo: TipoMovimentacaoEstoque.ENTRADA,
            tipoItem: dto.tipo,
            descricaoItem: descFormatada,
            quantidade: quantidadeFinal,
            unidadeMedida: unFormatada,
            motivo: `Entrada automática registrada via Doação #${doacao.id.slice(0, 8)}`,
            doacaoId: doacao.id,
          },
          usuario,
          tx,
        );
      }

      return DoacaoResponseDto.fromEntity(doacao);
    });
  }

  async listar(query: FiltrarDoacoesDto): Promise<RespostaPaginada<DoacaoResponseDto>> {
    const { data, total } = await this.doacoesRepository.listar({
      skip: query.skip,
      take: query.take,
      tipo: query.tipo,
      doadorId: query.doadorId,
      busca: query.busca?.trim() || undefined,
    });

    return paginar(
      data.map((item) => DoacaoResponseDto.fromEntity(item)),
      total,
      query,
    );
  }

  async buscarPorId(id: string): Promise<DoacaoResponseDto> {
    const doacao = await this.doacoesRepository.buscarPorId(id);
    if (!doacao || !doacao.ativo) {
      throw new NotFoundException('Doação não encontrada.');
    }

    return DoacaoResponseDto.fromEntity(doacao);
  }
}
