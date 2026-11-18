import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEventoAnimal } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarEventosAnimalDto extends PaginacaoDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 50,
    description: 'Itens por página na linha do tempo',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  override limit: number = 50;

  @ApiPropertyOptional({
    enum: TipoEventoAnimal,
    description:
      'Filtrar eventos por tipo (ENTRADA, SAIDA, MEDICO, FOTO, OUTRO)',
  })
  @IsOptional()
  @IsEnum(TipoEventoAnimal)
  tipo?: TipoEventoAnimal;
}
