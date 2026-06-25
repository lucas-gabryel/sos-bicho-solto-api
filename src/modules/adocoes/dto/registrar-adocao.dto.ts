import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RegistrarAdocaoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  readonly animalId!: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  readonly tutorId!: string;

  @ApiProperty({
    example: 'Adoção responsável, casa com quintal.',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly observacoes?: string;
}
