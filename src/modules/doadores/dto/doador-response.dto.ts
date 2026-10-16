import { ApiProperty } from '@nestjs/swagger';
import { Doador } from '@prisma/client';

export class DoadorResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  readonly id!: string;

  @ApiProperty({ example: 'Pet Shop Amigo Fiel LTDA' })
  readonly nomeRazaoSocial!: string;

  @ApiProperty({ example: '11222333000181' })
  readonly cpfCnpj!: string;

  @ApiProperty({ example: 'contato@amigofiel.com.br' })
  readonly email!: string;

  @ApiProperty({ example: '(82) 99912-3456' })
  readonly telefone!: string;

  @ApiProperty({ example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL' })
  readonly endereco!: string;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly criadoEm!: Date;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  readonly atualizadoEm!: Date;

  static fromEntity(doador: Doador): DoadorResponseDto {
    const dto = new DoadorResponseDto();
    Object.assign(dto, {
      id: doador.id,
      nomeRazaoSocial: doador.nomeRazaoSocial,
      cpfCnpj: doador.cpfCnpj,
      email: doador.email,
      telefone: doador.telefone,
      endereco: doador.endereco,
      criadoEm: doador.criadoEm,
      atualizadoEm: doador.atualizadoEm,
    });
    return dto;
  }
}
