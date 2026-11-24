import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IRelatoriosRepository } from './repositories/relatorios.repository.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SituacaoAcolhedor } from '#src/modules/tutores/enums/situacao-acolhedor.enum';
import {
  montarRelatorioAdotantes,
  montarRelatorioTutores,
} from './builders/relatorio-acolhedores.builder';
import {
  MetadadosRelatorio,
  montarRelatorioAnimais,
} from './builders/relatorio-animais.builder';
import { FiltrarRelatorioAnimaisDto } from './dto/filtrar-relatorio-animais.dto';
import { FiltrarRelatorioPeriodoDto } from './dto/filtrar-relatorio-periodo.dto';
import { RelatoriosPdfService } from './pdf/relatorios-pdf.service';
import { RELATORIOS_REPOSITORY } from './repositories/relatorios.repository.interface';

@Injectable()
export class RelatoriosService {
  constructor(
    @Inject(RELATORIOS_REPOSITORY)
    private readonly relatoriosRepository: IRelatoriosRepository,
    private readonly relatoriosPdfService: RelatoriosPdfService,
  ) {}

  async gerarRelatorioAnimais(
    filtros: FiltrarRelatorioAnimaisDto,
    usuario: JwtPayload,
  ): Promise<Buffer> {
    this.validarPeriodo(filtros);

    const [animais, meta] = await Promise.all([
      this.relatoriosRepository.buscarAnimais(filtros.especie),
      this.metadados(usuario),
    ]);

    return this.relatoriosPdfService.gerar(
      montarRelatorioAnimais(animais, filtros, meta),
    );
  }

  async gerarRelatorioTutores(
    filtros: FiltrarRelatorioPeriodoDto,
    usuario: JwtPayload,
  ): Promise<Buffer> {
    this.validarPeriodo(filtros);

    const [tutores, meta] = await Promise.all([
      this.relatoriosRepository.buscarAcolhedores(SituacaoAcolhedor.TUTOR),
      this.metadados(usuario),
    ]);

    return this.relatoriosPdfService.gerar(
      montarRelatorioTutores(tutores, filtros, meta),
    );
  }

  async gerarRelatorioAdotantes(
    filtros: FiltrarRelatorioPeriodoDto,
    usuario: JwtPayload,
  ): Promise<Buffer> {
    this.validarPeriodo(filtros);

    const [adotantes, meta] = await Promise.all([
      this.relatoriosRepository.buscarAcolhedores(SituacaoAcolhedor.ADOTANTE),
      this.metadados(usuario),
    ]);

    return this.relatoriosPdfService.gerar(
      montarRelatorioAdotantes(adotantes, filtros, meta),
    );
  }

  private validarPeriodo(filtros: FiltrarRelatorioPeriodoDto): void {
    if (filtros.de && filtros.ate && filtros.de > filtros.ate) {
      throw new BadRequestException(
        'A data inicial não pode ser maior que a data final.',
      );
    }
  }

  private async metadados(usuario: JwtPayload): Promise<MetadadosRelatorio> {
    const nome = await this.relatoriosRepository.buscarNomeUsuario(usuario.sub);
    return { geradoEm: new Date(), geradoPor: nome ?? usuario.email };
  }
}
