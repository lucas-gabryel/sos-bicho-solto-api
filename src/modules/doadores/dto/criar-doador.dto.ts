import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  IsCpfCnpj,
  normalizarCpfCnpj,
  validarCpfCnpj,
} from '../validators/cpf-cnpj.validator';

export class CriarDoadorDto {
  @ApiPropertyOptional({
    example: 'João Kinitos',
    description: 'Nome completo ou Razão Social do doador (alias)',
  })
  @IsString()
  @IsOptional()
  readonly nome?: string;

  @ApiPropertyOptional({
    example: 'Pet Shop Amigo Fiel LTDA',
    description: 'Nome completo ou Razão Social do doador',
  })
  @ValidateIf((o: CriarDoadorDto) => !o.nome)
  @IsString({ message: 'O nome ou razão social deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome ou razão social não pode ser vazio.' })
  readonly nomeRazaoSocial?: string;

  @ApiPropertyOptional({
    example: '11.222.333/0001-81',
    description: 'CPF ou CNPJ do doador (alias)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && validarCpfCnpj(value)) {
      return normalizarCpfCnpj(value);
    }
    return value as unknown;
  })
  @IsCpfCnpj({ message: 'CPF ou CNPJ inválido.' })
  readonly cpf?: string;

  @ApiPropertyOptional({
    example: '11.222.333/0001-81',
    description: 'CPF ou CNPJ do doador (alias)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && validarCpfCnpj(value)) {
      return normalizarCpfCnpj(value);
    }
    return value as unknown;
  })
  @IsCpfCnpj({ message: 'CPF ou CNPJ inválido.' })
  readonly cnpj?: string;

  @ApiPropertyOptional({
    example: '11.222.333/0001-81',
    description: 'CPF ou CNPJ do doador (com ou sem formatação)',
  })
  @ValidateIf((o: CriarDoadorDto) => !o.cpf && !o.cnpj)
  @IsString()
  @IsNotEmpty({ message: 'O CPF ou CNPJ deve ser informado.' })
  @Transform(({ value }) => {
    if (typeof value === 'string' && validarCpfCnpj(value)) {
      return normalizarCpfCnpj(value);
    }
    return value as unknown;
  })
  @IsCpfCnpj({ message: 'CPF ou CNPJ inválido.' })
  readonly cpfCnpj!: string;

  @ApiProperty({
    example: 'contato@amigofiel.com.br',
    description: 'E-mail de contato do doador',
  })
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  @IsNotEmpty()
  readonly email!: string;

  @ApiProperty({
    example: '(82) 99912-3456',
    description: 'Telefone de contato do doador',
  })
  @IsString()
  @IsNotEmpty()
  readonly telefone!: string;

  @ApiProperty({
    example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
    description: 'Endereço completo do doador',
  })
  @IsString()
  @IsNotEmpty()
  readonly endereco!: string;
}
