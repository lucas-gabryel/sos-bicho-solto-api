import { ApiPropertyOptional } from '@nestjs/swagger';
import { EspecieAnimal, StatusAnimal } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { FiltrarRelatorioPeriodoDto } from './filtrar-relatorio-periodo.dto';

export class FiltrarRelatorioAnimaisDto extends FiltrarRelatorioPeriodoDto {
  @ApiPropertyOptional({
    enum: StatusAnimal,
    description: 'Situação atual dos animais listados nas fichas históricas',
  })
  @IsOptional()
  @IsEnum(StatusAnimal)
  readonly status?: StatusAnimal;

  @ApiPropertyOptional({
    enum: EspecieAnimal,
    description: 'Restringe indicadores e fichas a uma espécie',
  })
  @IsOptional()
  @IsEnum(EspecieAnimal)
  readonly especie?: EspecieAnimal;
}
