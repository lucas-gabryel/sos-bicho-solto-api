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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Perfis } from '#src/common/decorators/perfis.decorator';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { AdocoesService } from './adocoes.service';
import { AdocaoResponseDto } from './dto/adocao-response.dto';
import { FiltrarAdocoesDto } from './dto/filtrar-adocoes.dto';
import { RegistrarAdocaoDto } from './dto/registrar-adocao.dto';
import { RegistrarDevolucaoDto } from './dto/registrar-devolucao.dto';

@ApiTags('adocoes')
@ApiBearerAuth()
@Controller('adocoes')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class AdocoesController {
  constructor(private readonly adocoesService: AdocoesService) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Adoção registrada com sucesso',
    type: AdocaoResponseDto,
  })
  registrar(
    @Body() dto: RegistrarAdocaoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.adocoesService.registrar(dto, usuario);
  }

  @Get()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Histórico de adoções paginado com filtros combinados',
  })
  listar(@Query() query: FiltrarAdocoesDto) {
    return this.adocoesService.listar(query);
  }

  @Post(':id/devolucao')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Devolução registrada com sucesso',
    type: AdocaoResponseDto,
  })
  devolver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarDevolucaoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.adocoesService.devolver(id, dto, usuario);
  }
}
