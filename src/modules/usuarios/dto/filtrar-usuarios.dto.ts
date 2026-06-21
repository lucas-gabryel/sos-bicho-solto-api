import { ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarUsuariosDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: Perfil })
  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;

  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail' })
  @IsOptional()
  @IsString()
  busca?: string;
}
