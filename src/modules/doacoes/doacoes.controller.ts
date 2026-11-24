import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import type { Response } from 'express';
import { Perfis } from '#src/common/decorators/perfis.decorator';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { salvarArquivoEvento, type ArquivoUpload } from '../animais/utils/documento-evento.util';
import { DoacoesService } from './doacoes.service';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import { RelatorioDoacoesFiltroDto } from './dto/relatorio-doacoes-filtro.dto';
import { RelatorioDoacoesResponseDto } from './dto/relatorio-doacoes-response.dto';
import { RelatorioPdfService } from './services/relatorio-pdf.service';

@ApiTags('doacoes')
@ApiBearerAuth()
@Controller('doacoes')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class DoacoesController {
  constructor(
    private readonly doacoesService: DoacoesService,
    private readonly relatorioPdfService: RelatorioPdfService,
  ) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Doação registrada com sucesso',
    type: DoacaoResponseDto,
  })
  registrar(
    @Body() dto: CriarDoacaoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.doacoesService.criar(dto, usuario);
  }

  @Post('upload-documento')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('documento'))
  @ApiConsumes('multipart/form-data')
  async uploadDocumento(
    @UploadedFile() arquivo?: ArquivoUpload,
    @Req() req?: any,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const host = req?.get ? req.get('host') : undefined;
    const baseUrl =
      process.env.API_BASE_URL ?? (host ? `${req.protocol}://${host}` : '');

    const resultado = await salvarArquivoEvento(arquivo, baseUrl);
    return resultado;
  }

  @Get('relatorio')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Dados consolidados para o relatório de doações',
    type: RelatorioDoacoesResponseDto,
  })
  obterRelatorio(@Query() query: RelatorioDoacoesFiltroDto) {
    return this.doacoesService.gerarRelatorio(query);
  }

  @Get('relatorio/pdf')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Download do relatório de doações em formato PDF',
  })
  async exportarRelatorioPdf(
    @Query() query: RelatorioDoacoesFiltroDto,
    @Res() res: Response,
  ) {
    const dados = await this.doacoesService.gerarRelatorio(query);
    const pdfBuffer = await this.relatorioPdfService.gerarPdf(dados as any);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=relatorio-doacoes-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
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
