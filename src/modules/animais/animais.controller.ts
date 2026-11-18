import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { Request } from 'express';
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
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { AnimaisService } from './animais.service';
import { CriarAnimalDto } from './dto/criar-animal.dto';
import { AtualizarAnimalDto } from './dto/atualizar-animal.dto';
import { AnimalResponseDto } from './dto/animal-response.dto';
import { FiltrarAnimaisDto } from './dto/filtrar-animais.dto';
import { AdicionarFotoDto } from './dto/adicionar-foto.dto';
import { CriarEventoAnimalDto } from './dto/criar-evento-animal.dto';
import { EventoAnimalResponseDto } from './dto/evento-animal-response.dto';
import { FiltrarEventosAnimalDto } from './dto/filtrar-eventos-animal.dto';
import type { ArquivoUpload } from './utils/documento-evento.util';
import { ExcluirUsuarioDto } from '#src/modules/usuarios/dto/excluir-usuario.dto';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { Perfis } from '#src/common/decorators/perfis.decorator';

interface ArquivosEventoUpload {
  documento?: ArquivoUpload[];
  arquivo?: ArquivoUpload[];
  anexo?: ArquivoUpload[];
  file?: ArquivoUpload[];
}

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
    description:
      'Detalhes do animal (inclui fotos e linha do tempo de eventos)',
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
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Animal excluído com sucesso',
  })
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcluirUsuarioDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.excluir(id, dto.senhaAdmin, usuario);
  }

  @Get(':id/eventos')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Linha do tempo de eventos do animal (paginada)',
  })
  listarEventos(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: FiltrarEventosAnimalDto,
  ) {
    return this.animaisService.listarEventos(id, query);
  }

  @Post(':id/eventos')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/json', 'multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documento', maxCount: 1 },
      { name: 'arquivo', maxCount: 1 },
      { name: 'anexo', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @ApiResponse({
    status: 201,
    description:
      'Evento adicionado de forma incremental à linha do tempo do animal',
    type: EventoAnimalResponseDto,
  })
  adicionarEvento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarEventoAnimalDto,
    @UsuarioAtual() usuario: JwtPayload,
    @Req() req: Request,
    @UploadedFiles() arquivos?: ArquivosEventoUpload,
  ) {
    const arquivo =
      arquivos?.documento?.[0] ??
      arquivos?.arquivo?.[0] ??
      arquivos?.anexo?.[0] ??
      arquivos?.file?.[0];

    const host = req.get('host');
    const baseUrl =
      process.env.API_BASE_URL ?? (host ? `${req.protocol}://${host}` : '');

    return this.animaisService.adicionarEvento(
      id,
      dto,
      usuario,
      arquivo,
      baseUrl,
    );
  }

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
