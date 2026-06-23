import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarTutoresDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Busca por nome ou CPF do tutor (busca parcial)',
  })
  @IsOptional()
  @IsString()
  busca?: string;
}
