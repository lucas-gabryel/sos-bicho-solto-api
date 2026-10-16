import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ExcluirUsuarioDto } from '#src/modules/usuarios/dto/excluir-usuario.dto';
import { DoadoresService } from './doadores.service';
import { AtualizarDoadorDto } from './dto/atualizar-doador.dto';
import { CriarDoadorDto } from './dto/criar-doador.dto';
import { DoadorResponseDto } from './dto/doador-response.dto';
import { FiltrarDoadoresDto } from './dto/filtrar-doadores.dto';

@ApiTags('doadores')
@ApiBearerAuth()
@Controller('doadores')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class DoadoresController {
  constructor(private readonly doadoresService: DoadoresService) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Doador criado com sucesso',
    type: DoadorResponseDto,
  })
  criar(@Body() dto: CriarDoadorDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.doadoresService.criar(dto, usuario);
  }

  @Get()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Listagem de doadores paginada',
  })
  listar(@Query() query: FiltrarDoadoresDto) {
    return this.doadoresService.listar(query);
  }

  @Get(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Detalhes do doador',
    type: DoadorResponseDto,
  })
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.doadoresService.buscarUm(id);
  }

  @Patch(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Doador atualizado com sucesso',
    type: DoadorResponseDto,
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarDoadorDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.doadoresService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @Perfis(Perfil.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Doador excluído com sucesso',
  })
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcluirUsuarioDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.doadoresService.excluir(id, dto.senhaAdmin, usuario);
  }
}
