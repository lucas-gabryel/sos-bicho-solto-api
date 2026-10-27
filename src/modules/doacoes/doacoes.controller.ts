import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import type { Response } from 'express';
import { Perfis } from '#src/common/decorators/perfis.decorator';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { DoacoesService } from './doacoes.service';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import { RelatorioDoacoesFiltroDto } from './dto/relatorio-doacoes-filtro.dto';
import { RelatorioDoacoesResponseDto } from './dto/relatorio-doacoes-response.dto';

@ApiTags('doacoes')
@ApiBearerAuth()
@Controller('doacoes')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class DoacoesController {
  constructor(private readonly doacoesService: DoacoesService) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Doação registrada com sucesso',
    type: DoacaoResponseDto,
  })
  registrar(@Body() dto: CriarDoacaoDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.doacoesService.criar(dto, usuario);
  }

  @Get()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Listagem de doações paginada com filtros combinados',
  })
  listar(@Query() query: FiltrarDoacoesDto) {
    return this.doacoesService.listar(query);
  }

  @Get('relatorio')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Consulta do relatório consolidado de doações',
    type: RelatorioDoacoesResponseDto,
  })
  obterRelatorio(@Query() query: RelatorioDoacoesFiltroDto) {
    return this.doacoesService.obterRelatorio(query);
  }

  @Get('relatorio/pdf')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description:
      'Exportação do relatório consolidado de doações em formato PDF',
  })
  async exportarRelatorioPdf(
    @Query() query: RelatorioDoacoesFiltroDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.doacoesService.gerarRelatorioPdf(query);
    const dataHoje = new Date().toISOString().slice(0, 10);
    const filename = `relatorio-doacoes-${dataHoje}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return new StreamableFile(pdfBuffer);
  }

  @Get(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Detalhes da doação',
    type: DoacaoResponseDto,
  })
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.doacoesService.buscarPorId(id);
  }
}
