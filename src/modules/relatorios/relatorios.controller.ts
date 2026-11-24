import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Perfis } from '#src/common/decorators/perfis.decorator';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { FiltrarRelatorioAnimaisDto } from './dto/filtrar-relatorio-animais.dto';
import { FiltrarRelatorioPeriodoDto } from './dto/filtrar-relatorio-periodo.dto';
import { RelatoriosService } from './relatorios.service';

function arquivoPdf(nome: string, conteudo: Buffer): StreamableFile {
  const data = new Date().toISOString().slice(0, 10);
  return new StreamableFile(conteudo, {
    type: 'application/pdf',
    disposition: `attachment; filename="relatorio-${nome}-${data}.pdf"`,
    length: conteudo.length,
  });
}

@ApiTags('relatorios')
@ApiBearerAuth()
@Controller('relatorios')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('animais')
  @Perfis(Perfil.ADMIN)
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Relatório histórico de animais em PDF',
  })
  async animais(
    @Query() filtros: FiltrarRelatorioAnimaisDto,
    @UsuarioAtual() usuario: JwtPayload,
  ): Promise<StreamableFile> {
    const pdf = await this.relatoriosService.gerarRelatorioAnimais(
      filtros,
      usuario,
    );
    return arquivoPdf('animais', pdf);
  }

  @Get('tutores')
  @Perfis(Perfil.ADMIN)
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Relatório histórico de tutores em PDF',
  })
  async tutores(
    @Query() filtros: FiltrarRelatorioPeriodoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ): Promise<StreamableFile> {
    const pdf = await this.relatoriosService.gerarRelatorioTutores(
      filtros,
      usuario,
    );
    return arquivoPdf('tutores', pdf);
  }

  @Get('adotantes')
  @Perfis(Perfil.ADMIN)
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Relatório histórico de adotantes em PDF',
  })
  async adotantes(
    @Query() filtros: FiltrarRelatorioPeriodoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ): Promise<StreamableFile> {
    const pdf = await this.relatoriosService.gerarRelatorioAdotantes(
      filtros,
      usuario,
    );
    return arquivoPdf('adotantes', pdf);
  }
}
