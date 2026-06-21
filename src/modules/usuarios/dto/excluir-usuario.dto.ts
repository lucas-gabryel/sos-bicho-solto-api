import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExcluirUsuarioDto {
  @ApiProperty({
    description: 'Senha do admin logado, para revalidação (RN03)',
  })
  @IsString()
  @IsNotEmpty()
  senhaAdmin!: string;
}
