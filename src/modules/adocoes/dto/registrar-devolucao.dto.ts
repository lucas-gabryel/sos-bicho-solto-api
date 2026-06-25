import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RegistrarDevolucaoDto {
  @ApiProperty({
    example: 'Tutor mudou de cidade.',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly observacoes?: string;
}
