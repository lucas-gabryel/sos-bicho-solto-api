import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class FiltrarRelatorioPeriodoDto {
  @ApiPropertyOptional({
    example: '2026-11-01T03:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Início do período analisado (sem valor: todo o histórico)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly de?: Date;

  @ApiPropertyOptional({
    example: '2026-12-01T02:59:59.999Z',
    type: 'string',
    format: 'date-time',
    description: 'Fim do período analisado',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly ate?: Date;
}
