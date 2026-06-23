import { ApiProperty } from '@nestjs/swagger';
import { Animal, StatusAnimal, FotoAnimal } from '@prisma/client';

export class FotoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  readonly id!: string;

  @ApiProperty({ example: 'https://exemplo.com/rex.jpg' })
  readonly url!: string;

  @ApiProperty({ example: true })
  readonly principal!: boolean;

  static fromEntity(foto: FotoAnimal): FotoResponseDto {
    const dto = new FotoResponseDto();
    Object.assign(dto, {
      id: foto.id,
      url: foto.url,
      principal: foto.principal,
    });
    return dto;
  }
}

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

  @ApiProperty({ type: [FotoResponseDto], required: false })
  readonly fotos?: FotoResponseDto[];

  static fromEntity(
    animal: Animal & { fotos?: FotoAnimal[] },
  ): AnimalResponseDto {
    const dto = new AnimalResponseDto();
    Object.assign(dto, {
      id: animal.id,
      numeroRegistro: animal.numeroRegistro,
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca,
      sexo: animal.sexo,
      porte: animal.porte,
      cor: animal.cor,
      pesoInicial: Number(animal.pesoInicial),
      pesoAtual: animal.pesoAtual ? Number(animal.pesoAtual) : null,
      dataNascimento: animal.dataNascimento,
      castrado: animal.castrado,
      vacinado: animal.vacinado,
      localResgate: animal.localResgate,
      observacoes: animal.observacoes,
      status: animal.status,
      tutorId: animal.tutorId,
      criadoEm: animal.criadoEm,
      modificadoEm: animal.modificadoEm,
      fotos: animal.fotos
        ? animal.fotos
            .filter((f) => f.ativo)
            .map((f) => ({
              id: f.id,
              url: f.url,
              principal: f.principal,
            }))
        : [],
    });
    return dto;
  }
}
