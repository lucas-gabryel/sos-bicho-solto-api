import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'Paula Freitas' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'paula@sosbichosolto.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Protetor@123', minLength: 8, maxLength: 15 })
  @Length(8, 15)
  @Matches(/(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+/, {
    message:
      'A senha deve ter 8–15 caracteres, ao menos 1 maiúscula e 1 caractere especial.',
  })
  senha!: string;

  @ApiPropertyOptional({ enum: Perfil, default: Perfil.PROTETOR })
  @IsOptional()
  @IsEnum(Perfil)
  perfil?: Perfil;
}
