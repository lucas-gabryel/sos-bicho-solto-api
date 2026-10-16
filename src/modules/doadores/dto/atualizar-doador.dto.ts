import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import {
  IsCpfCnpj,
  normalizarCpfCnpj,
  validarCpfCnpj,
} from '../validators/cpf-cnpj.validator';

export class AtualizarDoadorDto {
  @ApiPropertyOptional({
    example: 'Pet Shop Amigo Fiel LTDA',
    description: 'Nome completo ou Razão Social do doador',
  })
  @IsString()
  @IsOptional()
  readonly nomeRazaoSocial?: string;

  @ApiPropertyOptional({
    example: '11.222.333/0001-81',
    description: 'CPF ou CNPJ do doador (com ou sem formatação)',
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
  readonly cpfCnpj?: string;

  @ApiPropertyOptional({
    example: 'contato@amigofiel.com.br',
    description: 'E-mail de contato do doador',
  })
  @IsEmail({}, { message: 'O e-mail informado é inválido.' })
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional({
    example: '(82) 99912-3456',
    description: 'Telefone de contato do doador',
  })
  @IsString()
  @IsOptional()
  readonly telefone?: string;

  @ApiPropertyOptional({
    example: 'Rua Pedro Oliveira, 145 - Centro, Arapiraca/AL',
    description: 'Endereço completo do doador',
  })
  @IsString()
  @IsOptional()
  readonly endereco?: string;
}
