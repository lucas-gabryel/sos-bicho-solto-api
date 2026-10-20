import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';

export class FiltrarDoadoresDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description:
      'Busca por nome/razão social ou documento (CPF/CNPJ) do doador (busca parcial)',
  })
  @IsOptional()
  @IsString()
  busca?: string;
}
