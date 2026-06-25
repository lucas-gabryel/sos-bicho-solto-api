import { ApiProperty } from '@nestjs/swagger';
import { Adocao } from '@prisma/client';

export class AdocaoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  readonly animalId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  readonly tutorId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  readonly protetorId!: string;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly dataAdocao!: Date;

  @ApiProperty({
    example: 'Adoção responsável, casa com quintal.',
    nullable: true,
  })
  readonly observacoes?: string | null;

  @ApiProperty({ example: '2026-06-25T10:00:00Z', nullable: true })
  readonly devolvidoEm?: Date | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174003',
    nullable: true,
  })
  readonly devolvidoPorId?: string | null;

  @ApiProperty({
    example: 'Tutor mudou de cidade.',
    nullable: true,
  })
  readonly observacoesDevolucao?: string | null;

  static fromEntity(adocao: Adocao): AdocaoResponseDto {
    const dto = new AdocaoResponseDto();
    Object.assign(dto, {
      id: adocao.id,
      animalId: adocao.animalId,
      tutorId: adocao.tutorId,
      protetorId: adocao.protetorId,
      dataAdocao: adocao.dataAdocao,
      observacoes: adocao.observacoes,
      devolvidoEm: adocao.devolvidoEm,
      devolvidoPorId: adocao.devolvidoPorId,
      observacoesDevolucao: adocao.observacoesDevolucao,
    });
    return dto;
  }
}
