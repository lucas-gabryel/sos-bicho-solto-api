import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { FiltrarMovimentacoesDto } from './dto/filtrar-movimentacoes.dto';
import { MovimentacaoResponseDto } from './dto/movimentacao-response.dto';
import { RegistrarMovimentacaoDto } from './dto/registrar-movimentacao.dto';
import { ResumoEstoqueResponseDto } from './dto/saldo-estoque-response.dto';
import { EstoqueService } from './estoque.service';

@ApiTags('Estoque de Doações')
@Controller('estoque')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post('movimentacoes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar uma nova movimentação no estoque (saída, consumo ou ajuste)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Movimentação registrada com sucesso.',
    type: MovimentacaoResponseDto,
  })
  async registrar(
    @Body() dto: RegistrarMovimentacaoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ): Promise<MovimentacaoResponseDto> {
    return this.estoqueService.registrarMovimentacao(dto, usuario);
  }

  @Get('saldos')
  @ApiOperation({
    summary: 'Obter o resumo de saldo atual e controle de desabastecimento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumo do saldo de estoque retornado com sucesso.',
    type: ResumoEstoqueResponseDto,
  })
  async obterSaldos(): Promise<ResumoEstoqueResponseDto> {
    return this.estoqueService.obterResumoSaldos();
  }

  @Get('movimentacoes')
  @ApiOperation({
    summary: 'Listar movimentações do estoque com paginação e filtros',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de movimentações.',
  })
  async listar(
    @Query() query: FiltrarMovimentacoesDto,
  ) {
    return this.estoqueService.listarMovimentacoes(query);
  }

  @Get('movimentacoes/:id')
  @ApiOperation({
    summary: 'Buscar movimentação do estoque por ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes da movimentação.',
    type: MovimentacaoResponseDto,
  })
  async buscarPorId(@Param('id') id: string): Promise<MovimentacaoResponseDto> {
    return this.estoqueService.buscarPorId(id);
  }
}
