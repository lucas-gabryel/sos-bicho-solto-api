import { ApiProperty } from '@nestjs/swagger';
import { Animal, StatusAnimal } from '@prisma/client';

export class AnimalResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: '06.05.2026.1' })
  readonly numeroRegistro!: string;

  @ApiProperty({ example: 'Rex' })
  readonly nome!: string;

  @ApiProperty({ example: 'CAO' })
  readonly especie!: string;

  @ApiProperty({ example: 'SRD' })
  readonly raca!: string;

  @ApiProperty({ example: 'MACHO' })
  readonly sexo!: string;

  @ApiProperty({ example: 'MEDIO', nullable: true })
  readonly porte?: string | null;

  @ApiProperty({ example: 'Caramelo' })
  readonly cor!: string;

  @ApiProperty({ example: 10.5, type: 'number' })
  readonly pesoInicial!: number;

  @ApiProperty({ example: 11.2, nullable: true, type: 'number' })
  readonly pesoAtual?: number | null;

  @ApiProperty({ example: '2023-06-21', nullable: true, type: 'string' })
  readonly dataNascimento?: Date | null;

  @ApiProperty({ example: false })
  readonly castrado!: boolean;

  @ApiProperty({ example: false })
  readonly vacinado!: boolean;

  @ApiProperty({ example: 'Centro, Arapiraca/AL' })
  readonly localResgate!: string;

  @ApiProperty({ example: 'Animal dócil', nullable: true })
  readonly observacoes?: string | null;

  @ApiProperty({ example: 'ACOLHIMENTO' })
  readonly status!: StatusAnimal;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  readonly tutorId?: string | null;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly criadoEm!: Date;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly modificadoEm!: Date;

  static fromEntity(animal: Animal): AnimalResponseDto {
    const dto = new AnimalResponseDto();
    Object.assign(dto, {
      ...animal,
      pesoInicial: Number(animal.pesoInicial),
      pesoAtual: animal.pesoAtual ? Number(animal.pesoAtual) : null,
    });
    return dto;
  }
}
