import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TipoDoacao } from '@prisma/client';
import { DOADORES_REPOSITORY } from '#src/modules/doadores/repositories/doadores.repository.interface';
import { DoacoesService } from './doacoes.service';
import { CriarDoacaoDto } from './dto/criar-doacao.dto';
import { FiltrarDoacoesDto } from './dto/filtrar-doacoes.dto';
import { RelatorioDoacoesFiltroDto } from './dto/relatorio-doacoes-filtro.dto';
import { DOACOES_REPOSITORY } from './repositories/doacoes.repository.interface';
import { RelatorioPdfService } from './services/relatorio-pdf.service';

describe('DoacoesService', () => {
  let service: DoacoesService;

  const mockDoacoesRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listar: jest.fn(),
    obterRelatorio: jest.fn(),
  };

  const mockDoadoresRepository = {
    buscarPorId: jest.fn(),
  };

  const mockRelatorioPdfService = {
    gerarPdf: jest.fn(),
  };

  const usuarioLogado = {
    sub: 'user-123',
    email: 'user@test.com',
    perfil: 'PROTETOR' as const,
  };

  const mockDoador = {
    id: 'doador-123',
    nomeRazaoSocial: 'Doador Exemplo LTDA',
    cpfCnpj: '11222333000181',
    email: 'doador@exemplo.com',
    telefone: '(82) 99999-9999',
    endereco: 'Rua das Flores, 100',
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  const mockDoacaoCriada = {
    id: 'doacao-123',
    tipo: TipoDoacao.DINHEIRO,
    valor: 150.0,
    quantidade: null,
    unidadeMedida: null,
    descricao: 'Doação para ração',
    dataRecebimento: new Date('2026-10-26'),
    doadorId: 'doador-123',
    registradoPorId: 'user-123',
    ativo: true,
    criadoEm: new Date(),
    modificadoEm: new Date(),
    doador: mockDoador,
    registradoPor: {
      id: 'user-123',
      nome: 'Usuário Protetor',
      email: 'user@test.com',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoacoesService,
        {
          provide: DOACOES_REPOSITORY,
          useValue: mockDoacoesRepository,
        },
        {
          provide: DOADORES_REPOSITORY,
          useValue: mockDoadoresRepository,
        },
        {
          provide: RelatorioPdfService,
          useValue: mockRelatorioPdfService,
        },
      ],
    }).compile();

    service = module.get<DoacoesService>(DoacoesService);
  });

  describe('criar', () => {
    it('deve registrar uma doação com doador cadastrado com sucesso', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);
      mockDoacoesRepository.criar.mockResolvedValue(mockDoacaoCriada);

      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.DINHEIRO,
        valor: 150.0,
        dataRecebimento: '2026-10-26',
        doadorId: 'doador-123',
        anonima: false,
      };

      const result = await service.criar(dto, usuarioLogado);

      expect(mockDoadoresRepository.buscarPorId).toHaveBeenCalledWith(
        'doador-123',
      );
      expect(mockDoacoesRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoDoacao.DINHEIRO,
          valor: 150.0,
          doadorId: 'doador-123',
        }),
      );
      expect(result.id).toBe('doacao-123');
      expect(result.anonima).toBe(false);
    });

    it('deve registrar uma doação anônima sem exigir doadorId', async () => {
      const doacaoAnonima = {
        ...mockDoacaoCriada,
        doadorId: null,
        doador: null,
      };
      mockDoacoesRepository.criar.mockResolvedValue(doacaoAnonima);

      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.RACAO,
        quantidade: 20,
        unidadeMedida: 'kg',
        descricao: 'Ração de filhotes',
        dataRecebimento: '2026-10-26',
        anonima: true,
      };

      const result = await service.criar(dto, usuarioLogado);

      expect(mockDoadoresRepository.buscarPorId).not.toHaveBeenCalled();
      expect(mockDoacoesRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoDoacao.RACAO,
          quantidade: 20,
          doadorId: null,
        }),
      );
      expect(result.anonima).toBe(true);
    });

    it('deve lançar BadRequestException se doação não for anônima e doadorId não for informado', async () => {
      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.DINHEIRO,
        valor: 50,
        dataRecebimento: '2026-10-26',
        anonima: false,
      };

      await expect(service.criar(dto, usuarioLogado)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar NotFoundException se doador informado não existir ou estiver inativo', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(null);

      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.DINHEIRO,
        valor: 50,
        dataRecebimento: '2026-10-26',
        doadorId: 'inexistente',
        anonima: false,
      };

      await expect(service.criar(dto, usuarioLogado)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se tipo for DINHEIRO e valor não for informado ou for inválido', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);

      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.DINHEIRO,
        dataRecebimento: '2026-10-26',
        doadorId: 'doador-123',
        anonima: false,
      };

      await expect(service.criar(dto, usuarioLogado)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se tipo não for DINHEIRO e quantidade não for informada', async () => {
      mockDoadoresRepository.buscarPorId.mockResolvedValue(mockDoador);

      const dto: CriarDoacaoDto = {
        tipo: TipoDoacao.MEDICAMENTO,
        dataRecebimento: '2026-10-26',
        doadorId: 'doador-123',
        anonima: false,
      };

      await expect(service.criar(dto, usuarioLogado)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listar', () => {
    it('deve retornar lista paginada de doações', async () => {
      mockDoacoesRepository.listar.mockResolvedValue({
        data: [mockDoacaoCriada],
        total: 1,
      });

      const query = new FiltrarDoacoesDto();
      query.page = 1;
      query.limit = 10;

      const result = await service.listar(query);

      expect(mockDoacoesRepository.listar).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('buscarPorId', () => {
    it('deve retornar a doação quando encontrada', async () => {
      mockDoacoesRepository.buscarPorId.mockResolvedValue(mockDoacaoCriada);

      const result = await service.buscarPorId('doacao-123');

      expect(result.id).toBe('doacao-123');
    });

    it('deve lançar NotFoundException quando doação não for encontrada', async () => {
      mockDoacoesRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId('doacao-404')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('obterRelatorio', () => {
    const mockRelatorioDados = {
      totalDinheiro: 1500.5,
      itensAgrupados: [
        { tipo: TipoDoacao.RACAO, quantidadeTotal: 120, unidadeMedida: 'kg' },
        {
          tipo: TipoDoacao.MEDICAMENTO,
          quantidadeTotal: 30,
          unidadeMedida: 'unidades',
        },
      ],
      totalRegistros: 2,
      doacoes: [
        mockDoacaoCriada,
        {
          ...mockDoacaoCriada,
          id: 'doacao-racao-1',
          tipo: TipoDoacao.RACAO,
          valor: null,
          quantidade: 120,
          unidadeMedida: 'kg',
        },
      ],
    };

    it('deve consultar relatório sem filtros aplicados', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );

      const filtro: RelatorioDoacoesFiltroDto = {};
      const result = await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: undefined,
        dataFim: undefined,
        tipo: undefined,
      });
      expect(result.resumo.totalDinheiro).toBe(1500.5);
      expect(result.resumo.totalDinheiroFormatado).toContain('1.500,50');
      expect(result.resumo.itensAgrupados).toHaveLength(2);
      expect(result.resumo.totalRegistros).toBe(2);
      expect(result.filtros.dataInicio).toBeNull();
      expect(result.filtros.dataFim).toBeNull();
      expect(result.filtros.tipo).toBeNull();
      expect(result.doacoes).toHaveLength(2);
    });

    it('deve filtrar relatório por período completo', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );

      const filtro: RelatorioDoacoesFiltroDto = {
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
      };
      const result = await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: undefined,
      });
      expect(result.filtros.dataInicio).toBe('2026-10-01');
      expect(result.filtros.dataFim).toBe('2026-10-31');
    });

    it('deve filtrar relatório somente por data inicial', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );

      const filtro: RelatorioDoacoesFiltroDto = {
        dataInicio: '2026-10-01',
      };
      await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: '2026-10-01',
        dataFim: undefined,
        tipo: undefined,
      });
    });

    it('deve filtrar relatório somente por data final', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );

      const filtro: RelatorioDoacoesFiltroDto = {
        dataFim: '2026-10-31',
      };
      await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: undefined,
        dataFim: '2026-10-31',
        tipo: undefined,
      });
    });

    it('deve filtrar relatório por tipo de doação', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue({
        totalDinheiro: 1500.0,
        itensAgrupados: [],
        totalRegistros: 1,
        doacoes: [mockDoacaoCriada],
      });

      const filtro: RelatorioDoacoesFiltroDto = {
        tipo: TipoDoacao.DINHEIRO,
      };
      const result = await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: undefined,
        dataFim: undefined,
        tipo: TipoDoacao.DINHEIRO,
      });
      expect(result.resumo.totalDinheiro).toBe(1500.0);
      expect(result.resumo.itensAgrupados).toEqual([]);
      expect(result.filtros.tipo).toBe(TipoDoacao.DINHEIRO);
    });

    it('deve combinar período e tipo de doação', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );

      const filtro: RelatorioDoacoesFiltroDto = {
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: TipoDoacao.RACAO,
      };
      await service.obterRelatorio(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalledWith({
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: TipoDoacao.RACAO,
      });
    });

    it('deve lançar BadRequestException se dataInicio for posterior a dataFim', async () => {
      const filtro: RelatorioDoacoesFiltroDto = {
        dataInicio: '2026-10-31',
        dataFim: '2026-10-01',
      };

      await expect(service.obterRelatorio(filtro)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockDoacoesRepository.obterRelatorio).not.toHaveBeenCalled();
    });

    it('deve retornar valores zerados e vazios quando não houver registros no resultado', async () => {
      mockDoacoesRepository.obterRelatorio.mockResolvedValue({
        totalDinheiro: 0,
        itensAgrupados: [],
        totalRegistros: 0,
        doacoes: [],
      });

      const result = await service.obterRelatorio({});

      expect(result.resumo.totalDinheiro).toBe(0);
      expect(result.resumo.totalDinheiroFormatado).toContain('0,00');
      expect(result.resumo.itensAgrupados).toHaveLength(0);
      expect(result.resumo.totalRegistros).toBe(0);
      expect(result.doacoes).toHaveLength(0);
    });
  });

  describe('gerarRelatorioPdf', () => {
    it('deve obter o relatório e repassar para o RelatorioPdfService gerar o documento PDF', async () => {
      const mockRelatorioDados = {
        totalDinheiro: 500,
        itensAgrupados: [],
        totalRegistros: 1,
        doacoes: [mockDoacaoCriada],
      };
      mockDoacoesRepository.obterRelatorio.mockResolvedValue(
        mockRelatorioDados,
      );
      const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake PDF');
      mockRelatorioPdfService.gerarPdf.mockResolvedValue(fakePdfBuffer);

      const filtro: RelatorioDoacoesFiltroDto = { dataInicio: '2026-10-01' };
      const buffer = await service.gerarRelatorioPdf(filtro);

      expect(mockDoacoesRepository.obterRelatorio).toHaveBeenCalled();
      const calls = mockRelatorioPdfService.gerarPdf.mock
        .calls as unknown as Array<
        [{ resumo: { totalDinheiro: number }; doacoes: unknown[] }]
      >;
      const chamadoCom = calls[0][0];
      expect(chamadoCom.resumo.totalDinheiro).toBe(500);
      expect(chamadoCom.doacoes).toHaveLength(1);
      expect(buffer).toEqual(fakePdfBuffer);
    });
  });
});
