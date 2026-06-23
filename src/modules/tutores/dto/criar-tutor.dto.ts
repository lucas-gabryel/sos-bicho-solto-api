import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsDate,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class CriarTutorDto {
  @ApiProperty({ example: 'Ana Clara Santos', description: 'Nome do tutor' })
  @IsString()
  @IsNotEmpty()
  readonly nome!: string;

  @ApiProperty({
    example: '390.533.447-05',
    description: 'CPF do tutor (com ou sem formatação)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, {
    message:
      'O CPF deve estar no formato XXX.XXX.XXX-XX ou conter apenas 11 dígitos numéricos.',
  })
  readonly cpf!: string;

  @ApiProperty({
    example: '(82) 99912-3456',
    description: 'Telefone de contato',
  })
  @IsString()
  @IsNotEmpty()
  readonly telefone!: string;

  @ApiProperty({
    example: 'ana.clara@email.com',
    description: 'E-mail do tutor',
  })
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  @IsNotEmpty()
  readonly email!: string;

  @ApiProperty({
    example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
    description: 'Endereço completo',
  })
  @IsString()
  @IsNotEmpty()
  readonly endereco!: string;

  @ApiProperty({
    example: '1992-03-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Data de nascimento',
  })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  readonly dataNascimento!: Date;
}
