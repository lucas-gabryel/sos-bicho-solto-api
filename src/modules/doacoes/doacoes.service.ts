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
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import { RelatorioDoacoesFiltroDto } from './dto/relatorio-doacoes-filtro.dto';
import {
  LABELS_TIPO_DOACAO,
  RelatorioDoacoesResponseDto,
} from './dto/relatorio-doacoes-response.dto';
import type { IDoacoesRepository } from './repositories/doacoes.repository.interface';
import { DOACOES_REPOSITORY } from './repositories/doacoes.repository.interface';
import { RelatorioPdfService } from './services/relatorio-pdf.service';

@Injectable()
export class DoacoesService {
  constructor(
    @Inject(DOACOES_REPOSITORY)
    private readonly doacoesRepository: IDoacoesRepository,
    @Inject(DOADORES_REPOSITORY)
    private readonly doadoresRepository: IDoadoresRepository,
    private readonly relatorioPdfService: RelatorioPdfService,
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

    const dataRecebimento = new Date(dto.dataRecebimento);
    if (Number.isNaN(dataRecebimento.getTime())) {
      throw new BadRequestException('Data de recebimento inválida.');
    }

    const doacao = await this.doacoesRepository.criar({
      tipo: dto.tipo,
      valor: valorFinal,
      quantidade: quantidadeFinal,
      unidadeMedida: dto.unidadeMedida?.trim() || null,
      descricao: dto.descricao?.trim() || null,
      dataRecebimento,
      doadorId: doadorIdFinal,
      registradoPorId: usuario.sub,
    });

    return DoacaoResponseDto.fromEntity(doacao);
  }

  async listar(
    query: FiltrarDoacoesDto,
  ): Promise<RespostaPaginada<DoacaoResponseDto>> {
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

  async obterRelatorio(
    filtros: RelatorioDoacoesFiltroDto,
  ): Promise<RelatorioDoacoesResponseDto> {
    if (filtros.dataInicio && filtros.dataFim) {
      if (filtros.dataInicio > filtros.dataFim) {
        throw new BadRequestException(
          'A data inicial deve ser anterior ou igual à data final.',
        );
      }
    }

    const dados = await this.doacoesRepository.obterRelatorio({
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      tipo: filtros.tipo,
    });

    const totalDinheiroFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(dados.totalDinheiro);

    return {
      resumo: {
        totalDinheiro: dados.totalDinheiro,
        totalDinheiroFormatado,
        itensAgrupados: dados.itensAgrupados.map((item) => ({
          tipo: item.tipo,
          tipoLabel: LABELS_TIPO_DOACAO[item.tipo] || item.tipo,
          quantidadeTotal: item.quantidadeTotal,
          unidadeMedida: item.unidadeMedida ?? null,
        })),
        totalRegistros: dados.totalRegistros,
      },
      filtros: {
        dataInicio: filtros.dataInicio ?? null,
        dataFim: filtros.dataFim ?? null,
        tipo: filtros.tipo ?? null,
      },
      doacoes: dados.doacoes.map((item) => DoacaoResponseDto.fromEntity(item)),
      geradoEm: new Date().toISOString(),
    };
  }

  async gerarRelatorioPdf(filtros: RelatorioDoacoesFiltroDto): Promise<Buffer> {
    const relatorio = await this.obterRelatorio(filtros);
    return this.relatorioPdfService.gerarPdf(relatorio);
  }
}
