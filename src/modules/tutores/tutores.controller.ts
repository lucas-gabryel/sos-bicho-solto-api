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
import { TutoresService } from './tutores.service';
import { CriarTutorDto } from './dto/criar-tutor.dto';
import { AtualizarTutorDto } from './dto/atualizar-tutor.dto';
import { FiltrarTutoresDto } from './dto/filtrar-tutores.dto';
import { TutorResponseDto } from './dto/tutor-response.dto';
import { ExcluirUsuarioDto } from '#src/modules/usuarios/dto/excluir-usuario.dto';
import { AnimalResponseDto } from '#src/modules/animais/dto/animal-response.dto';
import { JwtAuthGuard } from '#src/common/guards/jwt-auth.guard';
import { PerfilGuard } from '#src/common/guards/perfil.guard';
import { UsuarioAtual } from '#src/common/decorators/usuario-atual.decorator';
import { Perfis } from '#src/common/decorators/perfis.decorator';

@ApiTags('tutores')
@ApiBearerAuth()
@Controller('tutores')
@UseGuards(JwtAuthGuard, PerfilGuard)
export class TutoresController {
  constructor(private readonly tutoresService: TutoresService) {}

  @Post()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Tutor criado com sucesso',
    type: TutorResponseDto,
  })
  criar(@Body() dto: CriarTutorDto, @UsuarioAtual() usuario: JwtPayload) {
    return this.tutoresService.criar(dto, usuario);
  }

  @Get()
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Listagem de tutores paginada',
  })
  listar(@Query() query: FiltrarTutoresDto) {
    return this.tutoresService.listar(query);
  }

  @Get(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Detalhes do tutor',
    type: TutorResponseDto,
  })
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.tutoresService.buscarUm(id);
  }

  @Patch(':id')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Tutor atualizado com sucesso',
    type: TutorResponseDto,
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTutorDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.tutoresService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @Perfis(Perfil.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Tutor excluído com sucesso',
  })
  excluir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExcluirUsuarioDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.tutoresService.excluir(id, dto.senhaAdmin, usuario);
  }

  @Get(':id/animais')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description:
      'Animais vinculados a este tutor (retorna no máximo os 100 primeiros animais)',
    type: [AnimalResponseDto],
  })
  buscarAnimaisDoTutor(@Param('id', ParseUUIDPipe) id: string) {
    return this.tutoresService.buscarAnimaisDoTutor(id);
  }
}
