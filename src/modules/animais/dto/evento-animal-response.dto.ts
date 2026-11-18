import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventoAnimal,
  MotivoSaidaAnimal,
  TipoEventoAnimal,
} from '@prisma/client';

export type EventoAnimalComAutor = EventoAnimal & {
  criadoPor?: {
    id: string;
    nome: string;
    email: string;
  } | null;
};

export class AutorEventoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: 'Paula Freitas' })
  readonly nome!: string;

  @ApiProperty({ example: 'protetor@sosbichosolto.com' })
  readonly email!: string;
}

export class EventoAnimalResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174010' })
  readonly id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly animalId!: string;

  @ApiProperty({ enum: TipoEventoAnimal, example: TipoEventoAnimal.MEDICO })
  readonly tipo!: TipoEventoAnimal;

  @ApiPropertyOptional({
    enum: MotivoSaidaAnimal,
    nullable: true,
    example: null,
  })
  readonly motivoSaida?: MotivoSaidaAnimal | null;

  @ApiProperty({
    example: 'Realizado exame de sangue completo e aplicação de vacina V10.',
  })
  readonly descricao!: string;

  @ApiProperty({ example: '2026-11-17T14:00:00.000Z' })
  readonly data!: Date;

  @ApiProperty({ example: '2026-11-17T14:00:00.000Z' })
  readonly dataEvento!: Date;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/exame-hemograma.pdf',
    nullable: true,
  })
  readonly documentoUrl?: string | null;

  @ApiPropertyOptional({
    example: 'exame-hemograma.pdf',
    nullable: true,
  })
  readonly documentoNome?: string | null;

  @ApiPropertyOptional({
    example: 'application/pdf',
    nullable: true,
  })
  readonly documentoTipo?: string | null;

  @ApiProperty({ example: false })
  readonly automatico!: boolean;

  @ApiProperty({ example: '2026-11-17T14:05:00.000Z' })
  readonly criadoEm!: Date;

  @ApiPropertyOptional({ type: AutorEventoResponseDto, nullable: true })
  readonly criadoPor?: AutorEventoResponseDto | null;

  static fromEntity(evento: EventoAnimalComAutor): EventoAnimalResponseDto {
    const dto = new EventoAnimalResponseDto();
    Object.assign(dto, {
      id: evento.id,
      animalId: evento.animalId,
      tipo: evento.tipo,
      motivoSaida: evento.motivoSaida ?? null,
      descricao: evento.descricao,
      data: evento.dataEvento,
      dataEvento: evento.dataEvento,
      documentoUrl: evento.documentoUrl ?? null,
      documentoNome: evento.documentoNome ?? null,
      documentoTipo: evento.documentoTipo ?? null,
      automatico: evento.automatico,
      criadoEm: evento.criadoEm,
      criadoPor: evento.criadoPor
        ? {
            id: evento.criadoPor.id,
            nome: evento.criadoPor.nome,
            email: evento.criadoPor.email,
          }
        : null,
    });
    return dto;
  }
}
