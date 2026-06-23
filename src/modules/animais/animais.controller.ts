import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { AnimaisService } from './animais.service';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { AnimalResponseDto } from './dto/animal-response.dto';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import { AdicionarFotoDto } from './dto/adicionar-foto.dto';
import { ExcluirUsuarioDto } from '#src/modules/usuarios/dto/excluir-usuario.dto';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { Perfis } from '#src/common/decorators/perfis.decorator';

@ApiTags('animais')
@ApiBearerAuth()
@Controller('animais')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class AnimaisController {
  constructor(private readonly animaisService: AnimaisService) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Animal criado com sucesso',
    type: AnimalResponseDto,
  })
  criar(@Body() dto: CriarAnimalDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.animaisService.criar(dto, usuario);
  }

  @Get()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Listagem de animais paginada com filtros combinados',
  })
  listar(@Query() query: FiltrarAnimaisDto) {
    return this.animaisService.listar(query);
  }

  @Get(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Detalhes do animal',
    type: AnimalResponseDto,
  })
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.animaisService.buscarPorId(id);
  }

  @Patch(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Animal atualizado com sucesso',
    type: AnimalResponseDto,
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarAnimalDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @Perfis(Perfil.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Animal excluído com sucesso',
  })
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcluirUsuarioDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.excluir(id, dto.senhaAdmin, usuario);
  }

  // Endpoints de gerenciamento de fotos do animal (RN11/RN20)
  @Post(':id/fotos')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Foto adicionada com sucesso',
  })
  adicionarFoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdicionarFotoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.adicionarFoto(
      id,
      dto.url,
      dto.principal ?? false,
      usuario,
    );
  }

  @Patch(':id/fotos/:fotoId/principal')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Definido como foto principal do animal com sucesso',
  })
  definirFotoPrincipal(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.definirFotoPrincipal(id, fotoId, usuario);
  }

  @Delete(':id/fotos/:fotoId')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Foto do animal removida com sucesso',
  })
  removerFoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fotoId', ParseUUIDPipe) fotoId: string,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.removerFoto(id, fotoId, usuario);
  }
}
