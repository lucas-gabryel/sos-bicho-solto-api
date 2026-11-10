import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class RegistrarMovimentacaoDto {
  @ApiProperty({
    enum: TipoMovimentacaoEstoque,
    description: 'Tipo da movimentação no estoque',
    example: TipoMovimentacaoEstoque.SAIDA,
  })
  @IsEnum(TipoMovimentacaoEstoque, {
    message: 'Tipo de movimentação inválido. Deve ser ENTRADA, SAIDA ou AJUSTE.',
  })
  @IsNotEmpty({ message: 'O tipo da movimentação é obrigatório.' })
  tipo!: TipoMovimentacaoEstoque;

  @ApiProperty({
    enum: TipoDoacao,
    description: 'Categoria do item no estoque',
    example: TipoDoacao.RACAO,
  })
  @IsEnum(TipoDoacao, {
    message:
      'Tipo do item inválido. Deve ser RACAO, MEDICAMENTO, PRODUTO_LIMPEZA ou OUTRO.',
  })
  @IsNotEmpty({ message: 'O tipo do item é obrigatório.' })
  tipoItem!: TipoDoacao;

  @ApiProperty({
    description: 'Nome ou descrição do item movimentado',
    example: 'Ração Golden Cães Adultos 15kg',
  })
  @IsString({ message: 'A descrição do item deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição do item é obrigatória.' })
  @MaxLength(150, {
    message: 'A descrição do item deve ter no máximo 150 caracteres.',
  })
  descricaoItem!: string;

  @ApiProperty({
    description: 'Quantidade movimentada (para AJUSTE permite zero ou positivo; para ENTRADA/SAIDA estritamente maior que zero)',
    example: 2,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'A quantidade deve ser um número com até 2 casas decimais.' },
  )
  @ValidateIf((o: RegistrarMovimentacaoDto) => o.tipo === TipoMovimentacaoEstoque.AJUSTE)
  @Min(0, { message: 'A quantidade para ajuste deve ser maior ou igual a zero.' })
  @ValidateIf((o: RegistrarMovimentacaoDto) => o.tipo !== TipoMovimentacaoEstoque.AJUSTE)
  @Min(0.01, { message: 'A quantidade deve ser maior que zero.' })
  @IsNotEmpty({ message: 'A quantidade é obrigatória.' })
  quantidade!: number;

  @ApiProperty({
    description: 'Unidade de medida do item',
    example: 'PCT',
  })
  @IsString({ message: 'A unidade de medida deve ser um texto.' })
  @IsNotEmpty({ message: 'A unidade de medida é obrigatória.' })
  @MaxLength(20, {
    message: 'A unidade de medida deve ter no máximo 20 caracteres.',
  })
  unidadeMedida!: string;

  @ApiProperty({
    description: 'Motivo ou justificativa da movimentação',
    example: 'Consumo no canil principal para alimentação semanal',
  })
  @IsString({ message: 'O motivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O motivo da movimentação é obrigatório.' })
  @MaxLength(255, { message: 'O motivo deve ter no máximo 255 caracteres.' })
  motivo!: string;

  @ApiPropertyOptional({
    description: 'ID da doação vinculada, caso se aplique',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'O ID da doação deve ser um UUID válido.' })
  doacaoId?: string;
}

