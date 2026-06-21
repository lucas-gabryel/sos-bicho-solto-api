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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { Perfis } from '#src/common/decorators/perfis.decorator';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { ExcluirUsuarioDto } from './dto/excluir-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@Perfis(Perfil.ADMIN)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  criar(@Body() dto: CriarUsuarioDto, @UsuarioAtual() autor: JwtPayload) {
    return this.usuariosService.criar(dto, autor.sub);
  }

  @Get()
  listar(@Query() filtros: FiltrarUsuariosDto) {
    return this.usuariosService.listar(filtros);
  }

  @Get(':id')
  buscarUm(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscarUm(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @UsuarioAtual() autor: JwtPayload,
  ) {
    return this.usuariosService.atualizar(id, dto, autor.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcluirUsuarioDto,
    @UsuarioAtual() admin: JwtPayload,
  ) {
    return this.usuariosService.excluir(id, dto.senhaAdmin, admin);
  }
}
