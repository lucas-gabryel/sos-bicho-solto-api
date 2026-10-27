import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  LABELS_TIPO_DOACAO,
  RelatorioDoacoesResponseDto,
} from '../dto/relatorio-doacoes-response.dto';

function formatarDataBr(dataStr: string): string {
  if (!dataStr) return '-';
  const partes = dataStr.slice(0, 10).split('-');
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
}

function formatarMoeda(valor?: number | null): string {
  if (valor === undefined || valor === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarQuantidade(
  qtd?: number | null,
  unidade?: string | null,
): string {
  if (qtd === undefined || qtd === null) return '-';
  const qtdFormatada = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(qtd);
  return unidade ? `${qtdFormatada} ${unidade}` : qtdFormatada;
}

@Injectable()
export class RelatorioPdfService {
  async gerarPdf(dados: RelatorioDoacoesResponseDto): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: 'Relatório Consolidado de Doações - SOS Bicho Solto',
          Author: 'SOS Bicho Solto',
          Subject: 'Relatório Consolidado de Doações',
        },
      });

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      const dataGeracao = new Date(dados.geradoEm || new Date());
      const dataGeracaoFormatada = `${dataGeracao.toLocaleDateString('pt-BR', {
        timeZone: 'America/Maceio',
      })} às ${dataGeracao.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Maceio',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;

      // ==========================================
      // 1. CABEÇALHO
      // ==========================================
      doc
        .fillColor('#c2410c')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('SOS BICHO SOLTO', 40, 40);
      doc
        .fillColor('#1e293b')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Relatório Consolidado de Doações', 40, 64);
      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(`Data e horário de geração: ${dataGeracaoFormatada}`, 40, 82);

      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(40, 98)
        .lineTo(555, 98)
        .stroke();

      // ==========================================
      // 2. IDENTIFICAÇÃO DOS FILTROS
      // ==========================================
      const boxFiltrosY = 106;
      doc.rect(40, boxFiltrosY, 515, 46).fillAndStroke('#f8fafc', '#e2e8f0');

      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('FILTROS APLICADOS', 50, boxFiltrosY + 8);

      const periodoDesc =
        dados.filtros.dataInicio && dados.filtros.dataFim
          ? `${formatarDataBr(dados.filtros.dataInicio)} até ${formatarDataBr(dados.filtros.dataFim)}`
          : dados.filtros.dataInicio
            ? `A partir de ${formatarDataBr(dados.filtros.dataInicio)}`
            : dados.filtros.dataFim
              ? `Até ${formatarDataBr(dados.filtros.dataFim)}`
              : 'Todo o período histórico';

      const tipoDesc = dados.filtros.tipo
        ? LABELS_TIPO_DOACAO[dados.filtros.tipo] || dados.filtros.tipo
        : 'Todos os tipos';

      const semFiltros =
        !dados.filtros.dataInicio &&
        !dados.filtros.dataFim &&
        !dados.filtros.tipo;

      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      if (semFiltros) {
        doc.text(
          'Critério: Sem filtros aplicados (exibindo todo o histórico de doações e todos os tipos)',
          50,
          boxFiltrosY + 24,
        );
      } else {
        doc.text(`Período: ${periodoDesc}`, 50, boxFiltrosY + 24);
        doc.text(`Tipo de Doação: ${tipoDesc}`, 260, boxFiltrosY + 24);
        doc.text(
          `Total Encontrado: ${dados.resumo.totalRegistros} registro(s)`,
          420,
          boxFiltrosY + 24,
        );
      }

      // ==========================================
      // 3. CONSOLIDAÇÃO DOS DADOS (RESUMO)
      // ==========================================
      let currentY = boxFiltrosY + 58;

      // Card Financeiro
      doc.rect(40, currentY, 250, 48).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc
        .fillColor('#166534')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('TOTAL RECEBIDO EM DINHEIRO', 50, currentY + 8);
      doc
        .fillColor('#15803d')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(dados.resumo.totalDinheiroFormatado, 50, currentY + 22);

      // Card Total Registros
      doc.rect(305, currentY, 250, 48).fillAndStroke('#f8fafc', '#e2e8f0');
      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('TOTAL DE DOAÇÕES NO PERÍODO', 315, currentY + 8);
      doc
        .fillColor('#0f172a')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`${dados.resumo.totalRegistros}`, 315, currentY + 22);

      currentY += 58;

      // Resumo de Itens Físicos
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Resumo por Tipo de Item', 40, currentY);
      currentY += 14;

      if (dados.resumo.itensAgrupados.length === 0) {
        doc.rect(40, currentY, 515, 24).fillAndStroke('#f8fafc', '#e2e8f0');
        doc
          .fillColor('#64748b')
          .fontSize(8)
          .font('Helvetica-Oblique')
          .text(
            dados.filtros.tipo === 'DINHEIRO'
              ? 'Filtro exclusivo de dinheiro selecionado (nenhum item físico aplicável).'
              : 'Nenhuma doação de item físico registrada no período filtrado.',
            50,
            currentY + 7,
          );
        currentY += 32;
      } else {
        // Tabela de itens
        doc.rect(40, currentY, 515, 18).fillAndStroke('#e2e8f0', '#cbd5e1');
        doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
        doc.text('Tipo de Doação', 46, currentY + 5);
        doc.text('Quantidade Acumulada', 246, currentY + 5);
        doc.text('Unidade de Medida', 406, currentY + 5);
        currentY += 18;

        for (const item of dados.resumo.itensAgrupados) {
          doc.rect(40, currentY, 515, 18).fillAndStroke('#ffffff', '#f1f5f9');
          doc.fillColor('#334155').fontSize(8).font('Helvetica');
          doc.text(item.tipoLabel, 46, currentY + 5);
          const qtdFormatada = new Intl.NumberFormat('pt-BR', {
            maximumFractionDigits: 2,
          }).format(item.quantidadeTotal);
          doc.text(qtdFormatada, 246, currentY + 5);
          doc.text(item.unidadeMedida || 'Não especificada', 406, currentY + 5);
          currentY += 18;
        }
        currentY += 12;
      }

      // ==========================================
      // 4. DETALHAMENTO DAS DOAÇÕES
      // ==========================================
      const desenharCabecalhoTabela = (y: number) => {
        doc.rect(40, y, 515, 18).fillAndStroke('#0f172a', '#0f172a');
        doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
        doc.text('DATA', 44, y + 5);
        doc.text('DOADOR', 100, y + 5);
        doc.text('TIPO', 215, y + 5);
        doc.text('DESCRIÇÃO', 290, y + 5);
        doc.text('QTD / UNID', 410, y + 5);
        doc.text('VALOR (R$)', 475, y + 5, { width: 75, align: 'right' });
        return y + 18;
      };

      if (currentY > 640) {
        doc.addPage();
        currentY = 40;
      }

      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Detalhamento das Doações', 40, currentY);
      currentY += 14;

      if (dados.doacoes.length === 0) {
        doc.rect(40, currentY, 515, 26).fillAndStroke('#f8fafc', '#e2e8f0');
        doc
          .fillColor('#64748b')
          .fontSize(8)
          .font('Helvetica-Oblique')
          .text(
            'Nenhum registro de doação encontrado para os critérios informados.',
            50,
            currentY + 8,
          );
        currentY += 34;
      } else {
        currentY = desenharCabecalhoTabela(currentY);

        let zebra = false;
        for (const doacao of dados.doacoes) {
          // Se estiver próximo ao rodapé, adiciona nova página e repete cabeçalho
          if (currentY > 740) {
            doc.addPage();
            currentY = desenharCabecalhoTabela(40);
            zebra = false;
          }

          const linhaBg = zebra ? '#f8fafc' : '#ffffff';
          doc.rect(40, currentY, 515, 18).fillAndStroke(linhaBg, '#f1f5f9');

          doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica');

          // Data
          doc.text(formatarDataBr(doacao.dataRecebimento), 44, currentY + 5);

          // Doador
          const doadorNome = doacao.anonima
            ? 'Anônimo'
            : doacao.doador?.nome || 'Anônimo';
          doc.text(
            doadorNome.length > 22
              ? `${doadorNome.slice(0, 20)}...`
              : doadorNome,
            100,
            currentY + 5,
          );

          // Tipo
          const tipoTexto = LABELS_TIPO_DOACAO[doacao.tipo] || doacao.tipo;
          doc.text(tipoTexto, 215, currentY + 5);

          // Descrição
          const desc = doacao.descricao
            ? doacao.descricao.replace(/[\r\n]+/g, ' ')
            : '-';
          doc.text(
            desc.length > 25 ? `${desc.slice(0, 23)}...` : desc,
            290,
            currentY + 5,
          );

          // Quantidade
          const qtdStr = formatarQuantidade(
            doacao.quantidade,
            doacao.unidadeMedida,
          );
          doc.text(qtdStr, 410, currentY + 5);

          // Valor
          const valorStr = formatarMoeda(doacao.valor);
          doc.text(valorStr, 475, currentY + 5, { width: 75, align: 'right' });

          currentY += 18;
          zebra = !zebra;
        }
      }

      // ==========================================
      // 5. RODAPÉ DINÂMICO COM NUMERAÇÃO DE PÁGINAS
      // ==========================================
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(40, 785)
          .lineTo(555, 785)
          .stroke();

        doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
        doc.text(
          'SOS Bicho Solto · Relatório Consolidado de Doações · Documento Oficial',
          40,
          792,
        );
        doc.text(`Página ${i + 1} de ${totalPages}`, 40, 792, {
          width: 515,
          align: 'right',
        });
      }

      doc.end();
    });
  }
}
