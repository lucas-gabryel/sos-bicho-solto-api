import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DirecaoDoacao, TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { paginar, RespostaPaginada } from '#src/common/dto/paginacao.dto';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IDoadoresRepository } from '#src/modules/doadores/repositories/doadores.repository.interface';
import { DOADORES_REPOSITORY } from '#src/modules/doadores/repositories/doadores.repository.interface';
import { EstoqueService } from '#src/modules/estoque/estoque.service';
import { normalizarItemEstoque } from '#src/modules/estoque/utils/estoque.utils';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import { RelatorioDoacoesFiltroDto } from './dto/relatorio-doacoes-filtro.dto';
import { LABELS_TIPO_DOACAO } from './dto/relatorio-doacoes-response.dto';
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
    const direcao = dto.direcao ?? DirecaoDoacao.RECEBIDA;
    let doadorIdFinal: string | null = null;

    if (direcao === DirecaoDoacao.RECEBIDA) {
      if (!dto.anonima) {
        if (!dto.doadorId) {
          throw new BadRequestException(
            'A seleção do doador é obrigatória quando a doação recebida não for anônima.',
          );
        }

        const doador = await this.doadoresRepository.buscarPorId(dto.doadorId);
        if (!doador || !doador.ativo) {
          throw new NotFoundException('Doador não encontrado ou inativo.');
        }

        doadorIdFinal = doador.id;
      }
    } else {
      // Doação REALIZADA pela ONG
      if (!dto.descricao || dto.descricao.trim() === '') {
        throw new BadRequestException(
          'A descrição é obrigatória para doações realizadas pela ONG.',
        );
      }
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
      throw new BadRequestException('Data da doação inválida.');
    }

    return this.doacoesRepository.executarTransacao(async (tx) => {
      const doacao = await this.doacoesRepository.criar(
        {
          tipo: dto.tipo,
          direcao,
          valor: valorFinal,
          quantidade: quantidadeFinal,
          unidadeMedida: dto.unidadeMedida?.trim() || null,
          descricao: dto.descricao?.trim() || null,
          beneficiario: dto.beneficiario?.trim() || null,
          dataRecebimento,
          doadorId: doadorIdFinal,
          registradoPorId: usuario.sub,
          documentoUrl: dto.documentoUrl?.trim() || null,
          documentoNome: dto.documentoNome?.trim() || null,
          documentoTipo: dto.documentoTipo?.trim() || null,
        },
        tx,
      );

      // Movimentação de estoque automática para itens materiais
      if (dto.tipo !== TipoDoacao.DINHEIRO && quantidadeFinal && quantidadeFinal > 0) {
        const {
          descricaoItem: descFormatada,
          unidadeMedida: unFormatada,
        } = normalizarItemEstoque(
          dto.descricao?.trim() || `Item de ${dto.tipo}`,
          dto.unidadeMedida,
        );

        if (direcao === DirecaoDoacao.RECEBIDA) {
          await this.estoqueService.registrarMovimentacao(
            {
              tipo: TipoMovimentacaoEstoque.ENTRADA,
              tipoItem: dto.tipo,
              descricaoItem: descFormatada,
              quantidade: quantidadeFinal,
              unidadeMedida: unFormatada,
              motivo: `Entrada automática via Doação Recebida #${doacao.id.slice(0, 8)}`,
              doacaoId: doacao.id,
            },
            usuario,
            tx,
          );
        } else {
          // Doação REALIZADA: dar saída no estoque
          await this.estoqueService.registrarMovimentacao(
            {
              tipo: TipoMovimentacaoEstoque.SAIDA,
              tipoItem: dto.tipo,
              descricaoItem: descFormatada,
              quantidade: quantidadeFinal,
              unidadeMedida: unFormatada,
              motivo: `Saída por Doação Realizada pela ONG #${doacao.id.slice(0, 8)}${
                dto.beneficiario ? ` para ${dto.beneficiario}` : ''
              }`,
              doacaoId: doacao.id,
            },
            usuario,
            tx,
          );
        }
      }

      return DoacaoResponseDto.fromEntity(doacao);
    });
  }

  async listar(query: FiltrarDoacoesDto): Promise<RespostaPaginada<DoacaoResponseDto>> {
    const { data, total } = await this.doacoesRepository.listar({
      skip: query.skip,
      take: query.take,
      tipo: query.tipo,
      direcao: query.direcao,
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

  async gerarRelatorio(filtro: RelatorioDoacoesFiltroDto) {
    let dataInicio: Date | undefined;
    let dataFim: Date | undefined;

    if (filtro.dataInicio) {
      const partes = filtro.dataInicio.split('-');
      dataInicio = new Date(Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 0, 0, 0));
    }

    if (filtro.dataFim) {
      const partes = filtro.dataFim.split('-');
      dataFim = new Date(Date.UTC(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59));
    }

    if (dataInicio && dataFim && dataInicio > dataFim) {
      throw new BadRequestException('A data de início não pode ser posterior à data final.');
    }

    const doacoes = await this.doacoesRepository.buscarParaRelatorio({
      dataInicio,
      dataFim,
      tipo: filtro.tipo,
      direcao: filtro.direcao,
    });

    const itensDto = doacoes.map((item) => DoacaoResponseDto.fromEntity(item));

    let totalDinheiro = 0;
    let totalDinheiroRealizado = 0;
    let totalRecebidas = 0;
    let totalRealizadas = 0;

    const agrupamentoRecebidas = new Map<string, { tipo: TipoDoacao; quantidadeTotal: number; unidadeMedida?: string | null }>();
    const agrupamentoRealizadas = new Map<string, { tipo: TipoDoacao; quantidadeTotal: number; unidadeMedida?: string | null }>();

    for (const d of doacoes) {
      const isRecebida = d.direcao === DirecaoDoacao.RECEBIDA;
      if (isRecebida) {
        totalRecebidas++;
      } else {
        totalRealizadas++;
      }

      if (d.tipo === TipoDoacao.DINHEIRO) {
        const val = d.valor ? Number(d.valor) : 0;
        if (isRecebida) {
          totalDinheiro += val;
        } else {
          totalDinheiroRealizado += val;
        }
      } else {
        const qtd = d.quantidade ? Number(d.quantidade) : 0;
        const un = d.unidadeMedida?.trim().toLowerCase() || 'un';
        const key = `${d.tipo}-${un}`;
        const mapa = isRecebida ? agrupamentoRecebidas : agrupamentoRealizadas;

        const anterior = mapa.get(key);
        if (anterior) {
          anterior.quantidadeTotal += qtd;
        } else {
          mapa.set(key, {
            tipo: d.tipo,
            quantidadeTotal: qtd,
            unidadeMedida: d.unidadeMedida ?? null,
          });
        }
      }
    }

    const itensAgrupados = Array.from(agrupamentoRecebidas.values()).map((item) => ({
      tipo: item.tipo,
      tipoLabel: LABELS_TIPO_DOACAO[item.tipo],
      quantidadeTotal: item.quantidadeTotal,
      unidadeMedida: item.unidadeMedida,
    }));

    const itensRealizadosAgrupados = Array.from(agrupamentoRealizadas.values()).map((item) => ({
      tipo: item.tipo,
      tipoLabel: LABELS_TIPO_DOACAO[item.tipo],
      quantidadeTotal: item.quantidadeTotal,
      unidadeMedida: item.unidadeMedida,
    }));

    return {
      resumo: {
        totalDinheiro,
        totalDinheiroFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDinheiro),
        totalDinheiroRealizado,
        totalDinheiroRealizadoFormatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDinheiroRealizado),
        itensAgrupados,
        itensRealizadosAgrupados,
        totalRegistros: doacoes.length,
        totalRecebidas,
        totalRealizadas,
      },
      filtros: {
        dataInicio: filtro.dataInicio ?? null,
        dataFim: filtro.dataFim ?? null,
        tipo: filtro.tipo ?? null,
        direcao: filtro.direcao ?? null,
      },
      dataGeracao: new Date().toISOString(),
      itens: itensDto,
    };
  }
}
