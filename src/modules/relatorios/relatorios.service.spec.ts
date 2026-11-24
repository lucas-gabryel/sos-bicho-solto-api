import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EspecieAnimal, Perfil } from '@prisma/client';
import { SituacaoAcolhedor } from '#src/modules/tutores/enums/situacao-acolhedor.enum';
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
    expect(documento.titulo).toBe('Relatório Histórico de Animais');
    expect(documento.geradoPor).toBe('Malba Vinicius');
  });

  it('gera o relatório de tutores a partir dos acolhedores com animal vinculado', async () => {
    await service.gerarRelatorioTutores({}, usuario);

    expect(repository.buscarAcolhedores).toHaveBeenCalledWith(
      SituacaoAcolhedor.TUTOR,
    );
    expect(pdfService.gerar.mock.calls[0][0].titulo).toBe(
      'Relatório Histórico de Tutores',
    );
  });

  it('gera o relatório de adotantes a partir dos acolhedores sem animal vinculado', async () => {
    await service.gerarRelatorioAdotantes({}, usuario);

    expect(repository.buscarAcolhedores).toHaveBeenCalledWith(
      SituacaoAcolhedor.ADOTANTE,
    );
    expect(pdfService.gerar.mock.calls[0][0].titulo).toBe(
      'Relatório Histórico de Adotantes',
    );
  });

  it('usa o e-mail quando o nome do usuário não é encontrado', async () => {
    repository.buscarNomeUsuario.mockResolvedValue(null);

    await service.gerarRelatorioTutores({}, usuario);

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
      service.gerarRelatorioAdotantes(filtros, usuario),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.buscarAnimais).not.toHaveBeenCalled();
    expect(pdfService.gerar).not.toHaveBeenCalled();
  });
});
