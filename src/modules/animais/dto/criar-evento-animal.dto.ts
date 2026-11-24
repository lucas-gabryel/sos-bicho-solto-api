import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MotivoSaidaAnimal, TipoEventoAnimal } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const vazioParaUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CriarEventoAnimalDto {
  @ApiProperty({
    example: 'Realizado exame de sangue completo e aplicação de vacina V10.',
    description: 'Descrição do evento na linha do tempo do animal',
  })
  @IsString()
  @IsNotEmpty({ message: 'A descrição do evento é obrigatória.' })
  readonly descricao!: string;

  @ApiPropertyOptional({
    example: '2026-11-17T14:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Data de ocorrência do evento (padrão: data/hora atual)',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'A data do evento informada é inválida.' })
  readonly data?: Date;

  @ApiPropertyOptional({
    example: '2026-11-17T14:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Alias para a data de ocorrência do evento',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'A data do evento informada é inválida.' })
  readonly dataEvento?: Date;

  @ApiPropertyOptional({
    enum: TipoEventoAnimal,
    example: TipoEventoAnimal.MEDICO,
    description:
      'Categoria do evento (ENTRADA, SAIDA, MEDICO, FOTO, OUTRO). Padrão: OUTRO',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsEnum(TipoEventoAnimal)
  readonly tipo?: TipoEventoAnimal;

  @ApiPropertyOptional({
    enum: MotivoSaidaAnimal,
    example: MotivoSaidaAnimal.TRANSFERENCIA,
    description:
      'Motivo da saída quando o evento for do tipo SAIDA (ADOCAO, TRANSFERENCIA, OBITO)',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsEnum(MotivoSaidaAnimal)
  readonly motivoSaida?: MotivoSaidaAnimal;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/exame-hemograma.pdf',
    description:
      'URL ou Data URI do documento comprobatório (imagem, PDF, etc.) quando não enviado via multipart/form-data',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly documentoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/exame-hemograma.pdf',
    description: 'Alias de documentoUrl',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly url?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/exame-hemograma.pdf',
    description: 'Alias de documentoUrl',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly arquivoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/exame-hemograma.pdf',
    description: 'Alias de documentoUrl',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly anexoUrl?: string;

  @ApiPropertyOptional({
    example: 'hemograma-rex.pdf',
    description: 'Nome original do documento comprobatório',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly documentoNome?: string;

  @ApiPropertyOptional({
    example: 'application/pdf',
    description: 'MIME type do documento comprobatório',
  })
  @Transform(vazioParaUndefined)
  @IsOptional()
  @IsString()
  readonly documentoTipo?: string;
}
