import { ApiProperty } from '@nestjs/swagger';
import { Tutor } from '@prisma/client';

export class TutorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: 1 })
  readonly codigo!: number;

  @ApiProperty({ example: 'Ana Clara Santos' })
  readonly nome!: string;

  @ApiProperty({ example: '390.533.447-05' })
  readonly cpf!: string;

  @ApiProperty({ example: '(82) 99912-3456' })
  readonly telefone!: string;

  @ApiProperty({ example: 'ana.clara@email.com' })
  readonly email!: string;

  @ApiProperty({ example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL' })
  readonly endereco!: string;

  @ApiProperty({ example: '1992-03-15' })
  readonly dataNascimento!: Date;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly criadoEm!: Date;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly modificadoEm!: Date;

  static fromEntity(tutor: Tutor): TutorResponseDto {
    const dto = new TutorResponseDto();
    Object.assign(dto, {
      id: tutor.id,
      codigo: tutor.codigo,
      nome: tutor.nome,
      cpf: tutor.cpf,
      telefone: tutor.telefone,
      email: tutor.email,
      endereco: tutor.endereco,
      dataNascimento: tutor.dataNascimento,
      criadoEm: tutor.criadoEm,
      modificadoEm: tutor.modificadoEm,
    });
    return dto;
  }
}
