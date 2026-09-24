import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatarData } from '../../../utils/formatters';

/**
 * Exporta o resumo consolidado do Dashboard de Relatórios em PDF
 */
export async function exportarDashboardPDF({
  metricas,
  ordensServico = [],
  produtosEstoqueBaixo = [],
  periodoTexto = 'Este mês',
  tipoFiltro = 'Todos'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const azulEscuro = [6, 13, 48];     // #060d30
  const ciano = [0, 200, 255];        // #00c8ff
  const cinzaTexto = [100, 116, 139]; // #64748b
  const cinzaBorda = [226, 232, 240];

  // 1. CABEÇALHO DO RELATÓRIO
  doc.setFillColor(...azulEscuro);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ZEU-TECH • RELATÓRIO DE DESEMPENHO', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ciano);
  doc.text(`Período de Análise: ${periodoTexto.toUpperCase()} | Filtro: ${tipoFiltro.toUpperCase()}`, 14, 23);

  doc.setTextColor(255, 255, 255);
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 140, 23);

  let currentY = 40;

  // 2. CARDS CONSOLIDADOS (TABELA RESUMO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...azulEscuro);
  doc.text('1. Indicadores Principais', 14, currentY);
  currentY += 4;

  const dadosResumo = [
    [
      'Receita Total',
      `R$ ${formatCurrency(metricas.receitaTotal || 0)}`,
      'Despesas Totais',
      `R$ ${formatCurrency(metricas.despesasTotal || 0)}`
    ],
    [
      'Resultado Líquido',
      `R$ ${formatCurrency(metricas.lucroLiquido || 0)}`,
      'Margem de Lucro',
      `${metricas.margemLucro || 0}%`
    ],
    [
      'Ordens de Serviço',
      `${metricas.totalOS || 0} (${metricas.osConcluidas || 0} concluídas)`,
      'Orçamentos',
      `${metricas.totalOrcamentos || 0} (${metricas.orcamentosAprovados || 0} aprovados)`
    ],
    [
      'Materiais Utilizados',
      `${metricas.totalMateriaisUsados || 0} itens`,
      'Estoque Baixo',
      `${produtosEstoqueBaixo.length} produtos em alerta`
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

  // 3. SITUAÇÃO FINANCEIRA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...azulEscuro);
  doc.text('2. Resumo da Situação Financeira', 14, currentY);
  currentY += 4;

  const dadosFinanceiros = [
    [
      'Contas a Receber (Vencidas)',
      `R$ ${formatCurrency(metricas.receberVencidas || 0)}`,
      'Contas a Pagar (Vencidas)',
      `R$ ${formatCurrency(metricas.pagarVencidas || 0)}`
    ],
    [
      'Contas a Receber (Pendentes)',
      `R$ ${formatCurrency(metricas.receberPendentes || 0)}`,
      'Contas a Pagar (Pendentes)',
      `R$ ${formatCurrency(metricas.pagarPendentes || 0)}`
    ],
    [
      'Contas Recebidas (Pagas)',
      `R$ ${formatCurrency(metricas.receberPagas || 0)}`,
      'Contas Pagas',
      `R$ ${formatCurrency(metricas.pagarPagas || 0)}`
    ]
  ];

  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { fontStyle: 'bold' },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { fontStyle: 'bold' }
    },
    body: dadosFinanceiros
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // 4. TABELA DE ORDENS DE SERVIÇO RECENTES NO PERÍODO
  if (ordensServico.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...azulEscuro);
    doc.text(`3. Ordens de Serviço no Período (${ordensServico.length})`, 14, currentY);
    currentY += 4;

    const tabelaOS = ordensServico.slice(0, 15).map(os => [
      `#${os.codigoOS || 'S/N'}`,
      os.clienteNome || 'Cliente',
      os.tecnicoNome || 'A definir',
      os.dataAgendamento || os.dataAbertura || '-',
      (os.status || 'aberta').toUpperCase(),
      `R$ ${formatCurrency(os.valorTotal || 0)}`
    ]);

    doc.autoTable({
      startY: currentY,
      theme: 'striped',
      head: [['OS', 'Cliente', 'Técnico', 'Data', 'Status', 'Valor Total']],
      headStyles: { fillColor: azulEscuro, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [234, 88, 12] },
        5: { fontStyle: 'bold', halign: 'right' }
      },
      body: tabelaOS
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Se precisar de nova página para itens de estoque
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  // 5. ITENS EM ALERTA DE ESTOQUE
  if (produtosEstoqueBaixo.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...azulEscuro);
    doc.text(`4. Produtos com Estoque Baixo ou Crítico (${produtosEstoqueBaixo.length})`, 14, currentY);
    currentY += 4;

    const tabelaEstoque = produtosEstoqueBaixo.slice(0, 12).map(p => [
      p.nome || 'Produto',
      p.categoria || 'Geral',
      `${p.quantidade || 0} ${p.unidade || 'un'}`,
      `${p.estoqueMinimo || 5} ${p.unidade || 'un'}`,
      (p.quantidade <= 0 ? 'CRÍTICO (Zerado)' : 'BAIXO'),
      `R$ ${formatCurrency(p.precoVenda || 0)}`
    ]);

    doc.autoTable({
      startY: currentY,
      theme: 'striped',
      head: [['Produto', 'Categoria', 'Estoque Atual', 'Estoque Mín.', 'Situação', 'Preço Unit.']],
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        4: { fontStyle: 'bold', textColor: [220, 38, 38] },
        5: { halign: 'right' }
      },
      body: tabelaEstoque
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // RODAPÉ FINAL
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...cinzaTexto);
    doc.text(
      `Zeu-Tech Gestão de Serviços • Página ${i} de ${pageCount} • Gerado eletronicamente`,
      14,
      290
    );
  }

  doc.save(`relatorio_gestao_zeu_tech_${Date.now()}.pdf`);
}

/**
 * Exporta os dados consolidados em formato CSV para Excel
 */
export function exportarDashboardCSV({
  metricas,
  ordensServico = [],
  produtosEstoqueBaixo = [],
  periodoTexto = 'Este mês'
}) {
  let csvContent = '\uFEFF'; // UTF-8 BOM para garantir acentos corretos no Excel

  // 1. Resumo Geral
  csvContent += `ZEU-TECH - RELATÓRIO DE DESEMPENHO E GESTÃO\n`;
  csvContent += `Período:;${periodoTexto};Emitido em:;${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

  csvContent += `INDICADORES PRINCIPAIS\n`;
  csvContent += `Indicador;Valor\n`;
  csvContent += `Receita Total;R$ ${formatCurrency(metricas.receitaTotal || 0)}\n`;
  csvContent += `Despesas Totais;R$ ${formatCurrency(metricas.despesasTotal || 0)}\n`;
  csvContent += `Resultado Líquido (Lucro);R$ ${formatCurrency(metricas.lucroLiquido || 0)}\n`;
  csvContent += `Margem de Lucro;${metricas.margemLucro || 0}%\n`;
  csvContent += `Total de Ordens de Serviço;${metricas.totalOS || 0}\n`;
  csvContent += `OS Concluídas;${metricas.osConcluidas || 0}\n`;
  csvContent += `OS em Andamento/Abertas;${metricas.osEmAndamento || 0}\n`;
  csvContent += `Total de Orçamentos;${metricas.totalOrcamentos || 0}\n`;
  csvContent += `Orçamentos Aprovados;${metricas.orcamentosAprovados || 0}\n`;
  csvContent += `Materiais Utilizados em OS;${metricas.totalMateriaisUsados || 0} itens\n\n`;

  // 2. Situação Financeira
  csvContent += `SITUAÇÃO FINANCEIRA\n`;
  csvContent += `Tipo;Vencidas;A Vencer / Pendentes;Recebidas / Pagas\n`;
  csvContent += `Contas a Receber;R$ ${formatCurrency(metricas.receberVencidas || 0)};R$ ${formatCurrency(metricas.receberPendentes || 0)};R$ ${formatCurrency(metricas.receberPagas || 0)}\n`;
  csvContent += `Contas a Pagar;R$ ${formatCurrency(metricas.pagarVencidas || 0)};R$ ${formatCurrency(metricas.pagarPendentes || 0)};R$ ${formatCurrency(metricas.pagarPagas || 0)}\n\n`;

  // 3. Ordens de Serviço
  if (ordensServico.length > 0) {
    csvContent += `ORDENS DE SERVIÇO NO PERÍODO\n`;
    csvContent += `Código OS;Cliente;Técnico;Data;Status;Tipo de Serviço;Valor Materiais;Valor Mão de Obra;Valor Total\n`;
    ordensServico.forEach(os => {
      csvContent += `"${os.codigoOS || ''}";"${os.clienteNome || ''}";"${os.tecnicoNome || ''}";"${os.dataAgendamento || os.dataAbertura || ''}";"${os.status || ''}";"${os.tipoServico || ''}";"R$ ${formatCurrency(os.valorMateriais || 0)}";"R$ ${formatCurrency(os.valorMaoDeObra || 0)}";"R$ ${formatCurrency(os.valorTotal || 0)}"\n`;
    });
    csvContent += `\n`;
  }

  // 4. Estoque Baixo
  if (produtosEstoqueBaixo.length > 0) {
    csvContent += `PRODUTOS COM ESTOQUE BAIXO OU CRÍTICO\n`;
    csvContent += `Produto;Categoria;Estoque Atual;Estoque Mínimo;Preço Venda\n`;
    produtosEstoqueBaixo.forEach(p => {
      csvContent += `"${p.nome || ''}";"${p.categoria || ''}";"${p.quantidade || 0}";"${p.estoqueMinimo || 5}";"R$ ${formatCurrency(p.precoVenda || 0)}"\n`;
    });
  }

  // Download no navegador
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_zeu_tech_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
