import { ApiPropertyOptional } from '@nestjs/swagger';
import { EspecieAnimal } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { FiltrarRelatorioPeriodoDto } from './filtrar-relatorio-periodo.dto';

export class FiltrarRelatorioAnimaisDto extends FiltrarRelatorioPeriodoDto {
  @ApiPropertyOptional({
    enum: EspecieAnimal,
    description: 'Restringe o relatório a uma espécie',
  })
  @IsOptional()
  @IsEnum(EspecieAnimal)
  readonly especie?: EspecieAnimal;
}
