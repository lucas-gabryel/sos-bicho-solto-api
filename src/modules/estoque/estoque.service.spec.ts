import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TipoDoacao, TipoMovimentacaoEstoque } from '@prisma/client';
import { EstoqueService } from './estoque.service';
import { RegistrarMovimentacaoDto } from './dto/registrar-movimentacao.dto';
import { ESTOQUE_REPOSITORY } from './repositories/estoque.repository.interface';

describe('EstoqueService', () => {
  let service: EstoqueService;

  const mockEstoqueRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listar: jest.fn(),
    obterTodasAtivas: jest.fn(),
    calcularSaldoItem: jest.fn(),
  };

  const usuarioLogado = {
    sub: 'user-123',
    email: 'user@test.com',
    perfil: 'PROTETOR' as const,
  };

  const mockMovimentacao = {
    id: 'mov-1',
    tipo: TipoMovimentacaoEstoque.ENTRADA,
    tipoItem: TipoDoacao.RACAO,
    descricaoItem: 'Ração Cães Adultos 15kg',
    quantidade: 10,
    unidadeMedida: 'PCT',
    motivo: 'Recebimento de doação',
    dataMovimento: new Date(),
    doacaoId: 'doacao-1',
    registradoPorId: 'user-123',
    registradoPorNome: 'Protetor Silva',
    ativo: true,
    criadoEm: new Date(),
    modificadoEm: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstoqueService,
        {
          provide: ESTOQUE_REPOSITORY,
          useValue: mockEstoqueRepository,
        },
      ],
    }).compile();

    service = module.get<EstoqueService>(EstoqueService);
  });

  describe('registrarMovimentacao', () => {
    it('deve registrar entrada no estoque com sucesso', async () => {
      mockEstoqueRepository.criar.mockResolvedValue(mockMovimentacao);

      const dto: RegistrarMovimentacaoDto = {
        tipo: TipoMovimentacaoEstoque.ENTRADA,
        tipoItem: TipoDoacao.RACAO,
        descricaoItem: 'Ração Cães Adultos 15kg',
        quantidade: 10,
        unidadeMedida: 'PCT',
        motivo: 'Recebimento de doação',
        doacaoId: 'doacao-1',
      };

      const result = await service.registrarMovimentacao(dto, usuarioLogado);

      expect(mockEstoqueRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoMovimentacaoEstoque.ENTRADA,
          tipoItem: TipoDoacao.RACAO,
          quantidade: 10,
          unidadeMedida: 'PCT',
        }),
      );
      expect(result.id).toBe('mov-1');
    });

    it('deve rejeitar movimentação para tipo DINHEIRO', async () => {
      const dto: RegistrarMovimentacaoDto = {
        tipo: TipoMovimentacaoEstoque.ENTRADA,
        tipoItem: TipoDoacao.DINHEIRO,
        descricaoItem: 'Dinheiro',
        quantidade: 100,
        unidadeMedida: 'BRL',
        motivo: 'Dinheiro',
      };

      await expect(
        service.registrarMovimentacao(dto, usuarioLogado),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar saída quando o saldo for insuficiente', async () => {
      mockEstoqueRepository.calcularSaldoItem.mockResolvedValue(5);

      const dto: RegistrarMovimentacaoDto = {
        tipo: TipoMovimentacaoEstoque.SAIDA,
        tipoItem: TipoDoacao.RACAO,
        descricaoItem: 'Ração Cães Adultos 15kg',
        quantidade: 10,
        unidadeMedida: 'PCT',
        motivo: 'Consumo canil',
      };

      await expect(
        service.registrarMovimentacao(dto, usuarioLogado),
      ).rejects.toThrow(BadRequestException);
      expect(mockEstoqueRepository.calcularSaldoItem).toHaveBeenCalled();
    });

    it('deve permitir saída quando houver saldo suficiente', async () => {
      mockEstoqueRepository.calcularSaldoItem.mockResolvedValue(15);
      mockEstoqueRepository.criar.mockResolvedValue({
        ...mockMovimentacao,
        id: 'mov-saida',
        tipo: TipoMovimentacaoEstoque.SAIDA,
        quantidade: 5,
      });

      const dto: RegistrarMovimentacaoDto = {
        tipo: TipoMovimentacaoEstoque.SAIDA,
        tipoItem: TipoDoacao.RACAO,
        descricaoItem: 'Ração Cães Adultos 15kg',
        quantidade: 5,
        unidadeMedida: 'PCT',
        motivo: 'Consumo canil',
      };

      const result = await service.registrarMovimentacao(dto, usuarioLogado);
      expect(result.id).toBe('mov-saida');
      expect(result.tipo).toBe(TipoMovimentacaoEstoque.SAIDA);
    });
  });

  describe('obterResumoSaldos', () => {
    it('deve calcular corretamente os saldos acumulados e classificar status', async () => {
      mockEstoqueRepository.obterTodasAtivas.mockResolvedValue([
        {
          id: '1',
          tipo: TipoMovimentacaoEstoque.ENTRADA,
          tipoItem: TipoDoacao.RACAO,
          descricaoItem: 'Ração Cães',
          quantidade: 20,
          unidadeMedida: 'KG',
          motivo: 'Doação',
          dataMovimento: new Date('2026-11-01'),
          ativo: true,
        },
        {
          id: '2',
          tipo: TipoMovimentacaoEstoque.SAIDA,
          tipoItem: TipoDoacao.RACAO,
          descricaoItem: 'Ração Cães',
          quantidade: 18,
          unidadeMedida: 'KG',
          motivo: 'Consumo',
          dataMovimento: new Date('2026-11-05'),
          ativo: true,
        },
        {
          id: '3',
          tipo: TipoMovimentacaoEstoque.ENTRADA,
          tipoItem: TipoDoacao.MEDICAMENTO,
          descricaoItem: 'Vermífugo',
          quantidade: 10,
          unidadeMedida: 'CX',
          motivo: 'Doação',
          dataMovimento: new Date('2026-11-02'),
          ativo: true,
        },
        {
          id: '4',
          tipo: TipoMovimentacaoEstoque.SAIDA,
          tipoItem: TipoDoacao.MEDICAMENTO,
          descricaoItem: 'Vermífugo',
          quantidade: 10,
          unidadeMedida: 'CX',
          motivo: 'Uso total',
          dataMovimento: new Date('2026-11-08'),
          ativo: true,
        },
      ]);

      const resumo = await service.obterResumoSaldos();

      expect(resumo.totalItensDiferentes).toBe(2);
      expect(resumo.totalItensZerados).toBe(1); // Vermífugo zerado
      expect(resumo.totalItensBaixos).toBe(1); // Ração com 2kg remanescentes

      const itemRacao = resumo.itens.find((i) => i.descricaoItem === 'Ração Cães');
      expect(itemRacao?.saldoAtual).toBe(2);
      expect(itemRacao?.status).toBe('BAIXO');

      const itemVermifugo = resumo.itens.find((i) => i.descricaoItem === 'Vermífugo');
      expect(itemVermifugo?.saldoAtual).toBe(0);
      expect(itemVermifugo?.status).toBe('ZERADO');
    });
  });

  describe('buscarPorId', () => {
    it('deve lançar NotFoundException se movimentação não existir', async () => {
      mockEstoqueRepository.buscarPorId.mockResolvedValue(null);

      await expect(service.buscarPorId('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

