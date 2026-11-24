import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EspecieAnimal, Perfil } from '@prisma/client';
import { DocumentoRelatorio } from './pdf/documento-relatorio';
import { RelatoriosPdfService } from './pdf/relatorios-pdf.service';
import { RelatoriosService } from './relatorios.service';
import {
  IRelatoriosRepository,
  RELATORIOS_REPOSITORY,
} from './repositories/relatorios.repository.interface';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  let repository: jest.Mocked<IRelatoriosRepository>;
  let pdfService: { gerar: jest.Mock<Promise<Buffer>, [DocumentoRelatorio]> };

  const usuario = {
    sub: 'admin-id',
    email: 'admin@sosbichosolto.com',
    perfil: Perfil.ADMIN,
  };
  const PDF = Buffer.from('%PDF-1.3');

  beforeEach(async () => {
    const repositoryMock: jest.Mocked<IRelatoriosRepository> = {
      buscarAnimais: jest.fn().mockResolvedValue([]),
      buscarAcolhedores: jest.fn().mockResolvedValue([]),
      buscarDoacoes: jest.fn().mockResolvedValue([]),
      buscarMovimentacoesEstoque: jest.fn().mockResolvedValue([]),
      buscarNomeUsuario: jest.fn().mockResolvedValue('Malba Vinicius'),
    };
    pdfService = {
      gerar: jest
        .fn<Promise<Buffer>, [DocumentoRelatorio]>()
        .mockResolvedValue(PDF),
    };

    const module = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: RELATORIOS_REPOSITORY, useValue: repositoryMock },
        { provide: RelatoriosPdfService, useValue: pdfService },
      ],
    }).compile();

    service = module.get(RelatoriosService);
    repository = module.get(RELATORIOS_REPOSITORY);
  });

  it('gera o relatório de animais filtrando a espécie no repositório', async () => {
    const result = await service.gerarRelatorioAnimais(
      { especie: EspecieAnimal.GATO },
      usuario,
    );

    expect(result).toBe(PDF);
    expect(repository.buscarAnimais).toHaveBeenCalledWith(EspecieAnimal.GATO);
    const documento = pdfService.gerar.mock.calls[0][0];
    expect(documento.titulo).toBe('Relatório de Animais');
    expect(documento.geradoPor).toBe('Malba Vinicius');
  });

  it('gera o relatório de acolhedores com tutores e adotantes', async () => {
    await service.gerarRelatorioAcolhedores({}, usuario);

    expect(repository.buscarAcolhedores).toHaveBeenCalledTimes(1);
    expect(pdfService.gerar.mock.calls[0][0].titulo).toBe(
      'Relatório de Acolhedores',
    );
  });

  it('gera o relatório de doações com doações e estoque', async () => {
    await service.gerarRelatorioDoacoes({}, usuario);

    expect(repository.buscarDoacoes).toHaveBeenCalledTimes(1);
    expect(repository.buscarMovimentacoesEstoque).toHaveBeenCalledTimes(1);
    expect(pdfService.gerar.mock.calls[0][0].titulo).toBe(
      'Relatório de Doações',
    );
  });

  it('usa o e-mail quando o nome do usuário não é encontrado', async () => {
    repository.buscarNomeUsuario.mockResolvedValue(null);

    await service.gerarRelatorioAcolhedores({}, usuario);

    expect(pdfService.gerar.mock.calls[0][0].geradoPor).toBe(
      'admin@sosbichosolto.com',
    );
  });

  it('rejeita período com data inicial maior que a final', async () => {
    const filtros = {
      de: new Date('2026-12-01T00:00Z'),
      ate: new Date('2026-11-01T00:00Z'),
    };

    await expect(
      service.gerarRelatorioAnimais(filtros, usuario),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.gerarRelatorioDoacoes(filtros, usuario),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.buscarAnimais).not.toHaveBeenCalled();
    expect(pdfService.gerar).not.toHaveBeenCalled();
  });
});
