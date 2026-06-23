import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdicionarFotoDto {
  @ApiProperty({
    example: 'https://exemplo.com/foto.jpg',
    description: 'URL da foto',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Se é a foto principal',
  })
  @IsBoolean()
  @IsOptional()
  principal?: boolean;
}
