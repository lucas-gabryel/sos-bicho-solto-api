import { ApiProperty } from '@nestjs/swagger';
import { DashboardResumoData } from '../repositories/dashboard.repository.interface';

export class DashboardResumoDto {
  @ApiProperty({ example: 5 })
  readonly totalAnimais!: number;

  @ApiProperty({ example: 3 })
  readonly emAcolhimento!: number;

  @ApiProperty({ example: 2 })
  readonly adotados!: number;

  @ApiProperty({ example: 12, description: 'Acolhedores ativos cadastrados' })
  readonly acolhedores!: number;

  @ApiProperty({
    example: 2,
    description: 'Acolhedores com ao menos um animal ativo vinculado',
  })
  readonly tutores!: number;

  @ApiProperty({
    example: 10,
    description: 'Acolhedores sem animal ativo vinculado',
  })
  readonly adotantes!: number;

  static fromData(data: DashboardResumoData): DashboardResumoDto {
    const dto = new DashboardResumoDto();
    Object.assign(dto, data);
    return dto;
  }
}
