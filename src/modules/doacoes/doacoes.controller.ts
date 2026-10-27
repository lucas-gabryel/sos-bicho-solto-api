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
import { DoacoesService } from './doacoes.service';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { DoacaoResponseDto } from './dto/doacao-response.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';

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
  registrar(
    @Body() dto: CriarDoacaoDto,
    @UsuarioAtual() usuario: JwtPayload,
  ) {
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
