import { TipoDoacao } from '@prisma/client';
import { RelatorioDoacoesResponseDto } from '../dto/relatorio-doacoes-response.dto';
import { RelatorioPdfService } from './relatorio-pdf.service';

describe('RelatorioPdfService', () => {
  let service: RelatorioPdfService;

  beforeEach(() => {
    service = new RelatorioPdfService();
  });

  it('deve gerar um buffer PDF válido com cabeçalho %PDF-', async () => {
    const dados: RelatorioDoacoesResponseDto = {
      resumo: {
        totalDinheiro: 2500,
        totalDinheiroFormatado: 'R$ 2.500,00',
        itensAgrupados: [
          {
            tipo: TipoDoacao.RACAO,
            tipoLabel: 'Ração',
            quantidadeTotal: 50,
            unidadeMedida: 'kg',
          },
          {
            tipo: TipoDoacao.MEDICAMENTO,
            tipoLabel: 'Medicamento',
            quantidadeTotal: 10,
            unidadeMedida: 'caixas',
          },
        ],
        totalRegistros: 2,
      },
      filtros: {
        dataInicio: '2026-10-01',
        dataFim: '2026-10-31',
        tipo: null,
      },
      doacoes: [
        {
          id: 'doacao-1',
          tipo: TipoDoacao.DINHEIRO,
          valor: 2500,
          quantidade: null,
          unidadeMedida: null,
          descricao: 'Doação para custeio veterinário',
          dataRecebimento: '2026-10-15',
          doadorId: 'doador-1',
          anonima: false,
          doador: {
            id: 'doador-1',
            nome: 'Empresa Amiga dos Animais LTDA',
            cpfCnpj: '11222333000181',
          },
          registradoPor: {
            id: 'user-1',
            nome: 'Administrador',
          },
          criadoEm: new Date('2026-10-15T10:00:00.000Z'),
          modificadoEm: new Date('2026-10-15T10:00:00.000Z'),
        },
        {
          id: 'doacao-2',
          tipo: TipoDoacao.RACAO,
          valor: null,
          quantidade: 50,
          unidadeMedida: 'kg',
          descricao: 'Sacos de ração premium',
          dataRecebimento: '2026-10-20',
          doadorId: null,
          anonima: true,
          doador: null,
          registradoPor: null,
          criadoEm: new Date('2026-10-20T14:00:00.000Z'),
          modificadoEm: new Date('2026-10-20T14:00:00.000Z'),
        },
      ],
      geradoEm: '2026-10-27T17:00:00.000Z',
    };

    const pdfBuffer = await service.gerarPdf(dados);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(100);
    // Validação de assinatura mágica de arquivo PDF
    expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
  });

  it('deve gerar PDF com sucesso quando não houver doações (resultado vazio)', async () => {
    const dadosVazio: RelatorioDoacoesResponseDto = {
      resumo: {
        totalDinheiro: 0,
        totalDinheiroFormatado: 'R$ 0,00',
        itensAgrupados: [],
        totalRegistros: 0,
      },
      filtros: {
        dataInicio: null,
        dataFim: null,
        tipo: TipoDoacao.DINHEIRO,
      },
      doacoes: [],
      geradoEm: new Date().toISOString(),
    };

    const pdfBuffer = await service.gerarPdf(dadosVazio);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(100);
    expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
  });
});
