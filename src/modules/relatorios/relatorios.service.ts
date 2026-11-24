import type { JwtPayload } from '#src/common/interfaces/jwt-payload.interface';
import type { IRelatoriosRepository } from './repositories/relatorios.repository.interface';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { montarRelatorioAcolhedores } from './builders/relatorio-acolhedores.builder';
import {
  MetadadosRelatorio,
  montarRelatorioAnimais,
} from './builders/relatorio-animais.builder';
import { montarRelatorioDoacoes } from './builders/relatorio-doacoes.builder';
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

  async gerarRelatorioAcolhedores(
    filtros: FiltrarRelatorioPeriodoDto,
    usuario: JwtPayload,
  ): Promise<Buffer> {
    this.validarPeriodo(filtros);

    const [acolhedores, meta] = await Promise.all([
      this.relatoriosRepository.buscarAcolhedores(),
      this.metadados(usuario),
    ]);

    return this.relatoriosPdfService.gerar(
      montarRelatorioAcolhedores(acolhedores, filtros, meta),
    );
  }

  async gerarRelatorioDoacoes(
    filtros: FiltrarRelatorioPeriodoDto,
    usuario: JwtPayload,
  ): Promise<Buffer> {
    this.validarPeriodo(filtros);

    const [doacoes, movimentacoes, meta] = await Promise.all([
      this.relatoriosRepository.buscarDoacoes(),
      this.relatoriosRepository.buscarMovimentacoesEstoque(),
      this.metadados(usuario),
    ]);

    return this.relatoriosPdfService.gerar(
      montarRelatorioDoacoes(doacoes, movimentacoes, filtros, meta),
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
