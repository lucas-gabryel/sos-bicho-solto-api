import { ApiProperty } from '@nestjs/swagger';
import { DashboardResumoData } from '../repositories/dashboard.repository.interface';

export class DashboardResumoDto {
  @ApiProperty({ example: 5 })
  readonly totalAnimais!: number;

  @ApiProperty({ example: 3 })
  readonly emAcolhimento!: number;

  @ApiProperty({ example: 2 })
  readonly adotados!: number;

  @ApiProperty({ example: 12 })
  readonly tutores!: number;

  static fromData(data: DashboardResumoData): DashboardResumoDto {
    const dto = new DashboardResumoDto();
    Object.assign(dto, data);
    return dto;
  }
}
