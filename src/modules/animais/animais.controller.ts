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
  @Perfis(Perfil.ADMIN)
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
    description: 'Listagem de animais paginada',
  })
  listar(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.animaisService.listar(parseInt(skip), parseInt(take));
  }

  @Get('especie/:especie')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Animais filtrados por espécie',
  })
  listarPorEspecie(
    @Param('especie') especie: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.animaisService.listarPorEspecie(
      especie,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get('status/:status')
  @Perfis(Perfil.ADMIN, Perfil.PROTETOR)
  @ApiResponse({
    status: 200,
    description: 'Animais filtrados por status',
  })
  listarPorStatus(
    @Param('status') status: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.animaisService.listarPorStatus(
      status,
      parseInt(skip),
      parseInt(take),
    );
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
  @Perfis(Perfil.ADMIN)
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
    @UsuarioAtual() usuario: JwtPayload,
  ) {
    return this.animaisService.excluir(id, usuario);
  }
}
