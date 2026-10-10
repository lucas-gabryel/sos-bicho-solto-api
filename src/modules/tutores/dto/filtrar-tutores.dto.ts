import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginacaoDto } from '#src/common/dto/paginacao.dto';
import { SituacaoAcolhedor } from '../enums/situacao-acolhedor.enum';

export class FiltrarTutoresDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Busca por nome ou CPF do tutor (busca parcial)',
  })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({
    enum: SituacaoAcolhedor,
    description: 'Filtrar por situação (ADOTANTE ou TUTOR)',
  })
  @IsOptional()
  @IsEnum(SituacaoAcolhedor)
  situacao?: SituacaoAcolhedor;
}
