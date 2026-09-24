import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatarData } from '../../../utils/formatters';

/**
 * Exporta o Relatório Financeiro completo em PDF
 */
export async function exportarFinanceiroPDF({
  estatisticas,
  contasReceber = [],
  contasPagar = [],
  periodoTexto = 'Este mês'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const azulEscuro = [6, 13, 48];     // #060d30
  const ciano = [0, 200, 255];        // #00c8ff
  const cinzaTexto = [100, 116, 139]; // #64748b

  // 1. CABEÇALHO
  doc.setFillColor(...azulEscuro);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ZEU-TECH • DEMONSTRATIVO FINANCEIRO', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ciano);
  doc.text(`Período de Referência: ${periodoTexto.toUpperCase()}`, 14, 23);

  doc.setTextColor(255, 255, 255);
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 135, 23);

  let currentY = 40;

  // 2. INDICADORES CONSOLIDADOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...azulEscuro);
  doc.text('1. Indicadores Financeiros do Período', 14, currentY);
  currentY += 4;

  const dadosResumo = [
    [
      'Total a Receber (Previsto)',
      `R$ ${formatCurrency(estatisticas.totalAReceber || 0)}`,
      'Total a Pagar (Previsto)',
      `R$ ${formatCurrency(estatisticas.totalAPagar || 0)}`
    ],
    [
      'Receitas Realizadas',
      `R$ ${formatCurrency(estatisticas.totalReceitas || 0)}`,
      'Despesas Realizadas',
      `R$ ${formatCurrency(estatisticas.totalDespesas || 0)}`
    ],
    [
      'Saldo Líquido do Período',
      `R$ ${formatCurrency(estatisticas.saldo || 0)}`,
      'Situação do Saldo',
      estatisticas.saldo >= 0 ? 'SUPERAVITÁRIO (Positivo)' : 'DEFICITÁRIO (Negativo)'
    ],
    [
      'Recebimentos Vencidos',
      `R$ ${formatCurrency(estatisticas.receberVencidas || 0)} (${estatisticas.qtdReceberVencidas || 0})`,
      'Pagamentos Vencidos',
      `R$ ${formatCurrency(estatisticas.pagarVencidas || 0)} (${estatisticas.qtdPagarVencidas || 0})`
    ]
  ];

  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] },
      3: { fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    body: dadosResumo
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // 3. TABELA CONTAS A RECEBER
  if (contasReceber.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...azulEscuro);
    doc.text(`2. Contas a Receber no Período (${contasReceber.length})`, 14, currentY);
    currentY += 4;

    const tabelaReceber = contasReceber.slice(0, 15).map(c => {
      const dtVenc = c.dataVencimento ? formatarData(c.dataVencimento) : '-';
      return [
        c.clienteNome || 'Cliente',
        c.descricao || 'Recebimento',
        dtVenc,
        (c.status || 'pendente').toUpperCase(),
        `R$ ${formatCurrency(c.valor || 0)}`
      ];
    });

    doc.autoTable({
      startY: currentY,
      theme: 'striped',
      head: [['Cliente', 'Descrição', 'Vencimento', 'Status', 'Valor']],
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        4: { fontStyle: 'bold', halign: 'right' }
      },
      body: tabelaReceber
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Se precisar de nova página
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // 4. TABELA CONTAS A PAGAR
  if (contasPagar.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...azulEscuro);
    doc.text(`3. Contas a Pagar no Período (${contasPagar.length})`, 14, currentY);
    currentY += 4;

    const tabelaPagar = contasPagar.slice(0, 15).map(cp => {
      const dtVenc = cp.dataVencimento ? formatarData(cp.dataVencimento) : '-';
      return [
        cp.fornecedor || 'Fornecedor',
        cp.descricao || cp.categoria || 'Despesa',
        dtVenc,
        (cp.status || 'pendente').toUpperCase(),
        `R$ ${formatCurrency(cp.valor || 0)}`
      ];
    });

    doc.autoTable({
      startY: currentY,
      theme: 'striped',
      head: [['Fornecedor', 'Descrição / Categoria', 'Vencimento', 'Status', 'Valor']],
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        4: { fontStyle: 'bold', halign: 'right' }
      },
      body: tabelaPagar
    });
  }

  // RODAPÉ
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...cinzaTexto);
    doc.text(`Zeu-Tech • Gestão Financeira • Página ${i} de ${pageCount}`, 14, 290);
  }

  doc.save(`relatorio_financeiro_${Date.now()}.pdf`);
}

/**
 * Exporta dados financeiros para CSV (compatível com Excel)
 */
export function exportarFinanceiroCSV({
  estatisticas,
  contasReceber = [],
  contasPagar = [],
  periodoTexto = 'Este mês'
}) {
  let csvContent = '\uFEFF'; // UTF-8 BOM

  csvContent += `ZEU-TECH - DEMONSTRATIVO FINANCEIRO CONSOLIDADO\n`;
  csvContent += `Período:;${periodoTexto};Emitido em:;${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

  // Resumo
  csvContent += `INDICADORES FINANCEIROS\n`;
  csvContent += `Indicador;Valor\n`;
  csvContent += `Total a Receber;R$ ${formatCurrency(estatisticas.totalAReceber || 0)}\n`;
  csvContent += `Total a Pagar;R$ ${formatCurrency(estatisticas.totalAPagar || 0)}\n`;
  csvContent += `Receitas Realizadas;R$ ${formatCurrency(estatisticas.totalReceitas || 0)}\n`;
  csvContent += `Despesas Realizadas;R$ ${formatCurrency(estatisticas.totalDespesas || 0)}\n`;
  csvContent += `Saldo do Período;R$ ${formatCurrency(estatisticas.saldo || 0)}\n`;
  csvContent += `Contas a Receber Vencidas;R$ ${formatCurrency(estatisticas.receberVencidas || 0)}\n`;
  csvContent += `Contas a Pagar Vencidas;R$ ${formatCurrency(estatisticas.pagarVencidas || 0)}\n\n`;

  // Contas a Receber
  if (contasReceber.length > 0) {
    csvContent += `CONTAS A RECEBER\n`;
    csvContent += `Cliente;Descrição;Vencimento;Status;Valor\n`;
    contasReceber.forEach(c => {
      const dtVenc = c.dataVencimento ? formatarData(c.dataVencimento) : '';
      csvContent += `"${c.clienteNome || ''}";"${c.descricao || ''}";"${dtVenc}";"${c.status || ''}";"R$ ${formatCurrency(c.valor || 0)}"\n`;
    });
    csvContent += `\n`;
  }

  // Contas a Pagar
  if (contasPagar.length > 0) {
    csvContent += `CONTAS A PAGAR\n`;
    csvContent += `Fornecedor;Descrição;Categoria;Vencimento;Status;Valor\n`;
    contasPagar.forEach(cp => {
      const dtVenc = cp.dataVencimento ? formatarData(cp.dataVencimento) : '';
      csvContent += `"${cp.fornecedor || ''}";"${cp.descricao || ''}";"${cp.categoria || ''}";"${dtVenc}";"${cp.status || ''}";"R$ ${formatCurrency(cp.valor || 0)}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `financeiro_zeu_tech_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
