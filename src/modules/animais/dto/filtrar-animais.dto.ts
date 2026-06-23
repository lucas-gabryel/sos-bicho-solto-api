import { ApiPropertyOptional } from '@nestjs/swagger';
import { EspecieAnimal, StatusAnimal } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarAnimaisDto extends PaginacaoDto {
  @ApiPropertyOptional({
    enum: EspecieAnimal,
    description: 'Filtrar por espécie (CAO ou GATO)',
  })
  @IsOptional()
  @IsEnum(EspecieAnimal)
  especie?: EspecieAnimal;

  @ApiPropertyOptional({
    enum: StatusAnimal,
    description: 'Filtrar por status (ACOLHIMENTO ou ADOTADO)',
  })
  @IsOptional()
  @IsEnum(StatusAnimal)
  status?: StatusAnimal;

  @ApiPropertyOptional({
    description: 'Busca por nome ou número de registro do animal',
  })
  @IsOptional()
  @IsString()
  busca?: string;
}
