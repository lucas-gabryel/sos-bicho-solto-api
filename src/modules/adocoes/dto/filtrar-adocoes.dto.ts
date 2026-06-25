import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarAdocoesDto extends PaginacaoDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Filtrar histórico por tutor',
  })
  @IsOptional()
  @IsUUID()
  readonly tutorId?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: 'Filtrar histórico por animal',
  })
  @IsOptional()
  @IsUUID()
  readonly animalId?: string;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Data inicial do período de adoção',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly de?: Date;

  @ApiPropertyOptional({
    example: '2026-06-30T23:59:59.999Z',
    type: 'string',
    format: 'date-time',
    description: 'Data final do período de adoção',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly ate?: Date;
}
