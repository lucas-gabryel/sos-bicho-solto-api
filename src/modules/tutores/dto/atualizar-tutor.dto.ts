import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsEmail,
  IsDate,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class AtualizarTutorDto {
  @ApiPropertyOptional({
    example: 'Ana Clara Santos',
    description: 'Nome do tutor',
  })
  @IsString()
  @IsOptional()
  readonly nome?: string;

  @ApiPropertyOptional({
    example: '390.533.447-05',
    description: 'CPF do tutor (com ou sem formatação)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const isCpfFormat = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(value);
      if (isCpfFormat) {
        return value.replace(/\D/g, '');
      }
    }
    return value as unknown;
  })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, {
    message:
      'O CPF deve estar no formato XXX.XXX.XXX-XX ou conter apenas 11 dígitos numéricos.',
  })
  readonly cpf?: string;

  @ApiPropertyOptional({
    example: '(82) 99912-3456',
    description: 'Telefone de contato',
  })
  @IsString()
  @IsOptional()
  readonly telefone?: string;

  @ApiPropertyOptional({
    example: 'ana.clara@email.com',
    description: 'E-mail do tutor',
  })
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({
    example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
    description: 'Endereço completo',
  })
  @IsString()
  @IsOptional()
  readonly endereco?: string;

  @ApiPropertyOptional({
    example: '1992-03-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    description: 'Data de nascimento',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  readonly dataNascimento?: Date;
}
