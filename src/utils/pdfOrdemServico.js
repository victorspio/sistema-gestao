import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';
import { precarregarImagensPDF } from './pdfImageHelper';

const STATUS_LABELS = {
  aberta: 'ABERTA',
  agendada: 'AGENDADA',
  em_andamento: 'EM ANDAMENTO',
  aguardando_material: 'AGUARDANDO MATERIAL',
  concluida: 'CONCLUÍDA',
  cancelada: 'CANCELADA'
};

export async function gerarPdfOrdemServico(os, dadosEmpresa = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // ── CABEÇALHO ─────────────────────────────────────────────────────────────
  // Pré-carrega imagens
  const { mascote, logo } = await precarregarImagensPDF();

  // Dados da empresa
  const nomeEmpresa = dadosEmpresa.nome || 'Zeu Tech';
  const cnpj = dadosEmpresa.cnpj || '66.819.439/0001-59';
  const endereco = dadosEmpresa.endereco || 'Jeronimo Batista, N: 4516';
  const telefone = dadosEmpresa.telefone || '(88) 9.9964-8656';
  const email = dadosEmpresa.email || 'zeutech.online@gmail.com';

  // ── CABEÇALHO 3 COLUNAS ───────────────────────────────────────────────────
  const headerH = 42;

  // Fundo azul escuro
  doc.setFillColor(6, 13, 48);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Faixa ciano inferior
  doc.setFillColor(0, 200, 255);
  doc.rect(0, headerH - 1.5, pageWidth, 1.5, 'F');

  // ── ESQUERDA: título + dados ──────────────────────────────────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Ordem de Serviço', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 235, 255);
  const linhaH = 5;
  doc.text(nomeEmpresa, margin, 16);
  doc.text(`CNPJ: ${cnpj}`, margin, 16 + linhaH);
  doc.text(`Endereço: ${endereco}`, margin, 16 + linhaH * 2);
  doc.text(`Telefone: ${telefone}`, margin, 16 + linhaH * 3);
  doc.text(`E-mail: ${email}`, margin, 16 + linhaH * 4);

  // ── CENTRO: mascote ─────────────────────────────────────────────────────────
  if (mascote) {
    const mascW = 22;
    const mascH = 36;
    const mascX = (pageWidth - mascW) / 2;
    const mascY = headerH - mascH - 0; // pés alinhados com a faixa ciano
    doc.addImage(mascote, 'PNG', mascX, mascY, mascW, mascH);
  }

  // ── DIREITA: logo ─────────────────────────────────────────────────────────
  if (logo) {
    const logoW = 46;
    const logoH = 34;
    const logoX = pageWidth - margin - logoW;
    const logoY = (headerH - logoH) / 2;
    doc.addImage(logo, 'PNG', logoX, logoY, logoW, logoH);
  }

  // Número da OS + status (abaixo do cabeçalho)
  let y = headerH + 6;

  const statusLabel = STATUS_LABELS[os.status] || (os.status || 'ABERTA').toUpperCase();
  const dataCriacao = os.criadoEm?.toDate ? os.criadoEm.toDate() : new Date(os.dataAbertura || os.criadoEm || Date.now());

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`ORDEM DE SERVIÇO Nº ${os.codigoOS || '00000'}`, pageWidth - margin, y - 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Abertura: ${dataCriacao.toLocaleDateString('pt-BR')} | Status: ${statusLabel}`, pageWidth - margin, y + 3, { align: 'right' });

  y += 8;


  // ── DADOS DO CLIENTE & LOCAL DE ATENDIMENTO ──────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 26, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DADOS DO CLIENTE & LOCAL DE ATENDIMENTO', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const clienteLinha1 = `Cliente: ${os.clienteNome || 'Consumidor'} ${os.clienteCpf ? `| CPF/CNPJ: ${os.clienteCpf}` : ''}`;
  doc.text(clienteLinha1, margin + 4, y + 12);

  const clienteLinha2 = `Contato: ${os.clienteTelefone || os.clienteWhatsapp || 'Não informado'} | Agendamento: ${os.dataAgendamento || 'A definir'}`;
  doc.text(clienteLinha2, margin + 4, y + 17);

  const enderecoCompleto = os.localInstalacao || os.clienteEndereco || 'Endereço principal cadastrado';
  doc.text(`Local da Instalação / Manutenção: ${enderecoCompleto}`, margin + 4, y + 22);

  y += 31;

  // ── DADOS DO TÉCNICO & TIPO DE SERVIÇO ────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EQUIPE TÉCNICA E TIPO DE SERVIÇO', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Técnico Designado: ${os.tecnicoNome || 'A definir / Equipe de Plantão'}`, margin + 4, y + 11.5);
  doc.text(`Tipo de Atendimento: ${os.tipoServico || 'Instalação / Manutenção'}`, pageWidth / 2 + 10, y + 11.5);

  y += 21;

  // ── DESCRIÇÃO DO SERVIÇO / DIAGNÓSTICO / SOLUÇÃO ──────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DETALHAMENTO DO ATENDIMENTO TÉCNICO', margin, y);
  y += 3;

  const detalhamentoItems = [
    { label: 'Solicitação / Problema Relatado:', val: os.descricaoProblema || 'Instalação e configuração de equipamentos de segurança eletrônica.' },
    { label: 'Diagnóstico Técnico:', val: os.diagnosticoTecnico || 'Vistoria e conferência do cabeamento, pontos de fixação e alimentação elétrica.' },
    { label: 'Solução Executada / Laudo:', val: os.solucaoRealizada || (os.status === 'concluida' ? 'Serviço executado, testado e validado em conformidade técnica.' : 'Serviço agendado para execução conforme especificações.') }
  ];

  detalhamentoItems.forEach(item => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, margin + 3.5, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const textoQuebrado = doc.splitTextToSize(item.val, pageWidth - (margin * 2) - 8);
    doc.text(textoQuebrado, margin + 3.5, y + 9);

    y += 16;
  });

  y += 2;

  // ── PEÇAS E MATERIAIS UTILIZADOS NA OS ────────────────────────────────────
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EQUIPAMENTOS, PEÇAS E MATERIAIS UTILIZADOS', margin, y);
  y += 3;

  const materiaisRows = (os.materiaisUtilizados || []).map((m, idx) => {
    const qtd = parseFloat(m.quantidade) || 0;
    const unit = parseFloat(m.valorUnitario) || 0;
    const subtotal = qtd * unit;
    const desc = [
      m.nome || 'Item',
      m.marca ? `Marca: ${m.marca}` : '',
      m.modelo ? `Mod: ${m.modelo}` : '',
      m.numeroSerie ? `S/N: ${m.numeroSerie}` : ''
    ].filter(Boolean).join(' | ');

    return [
      idx + 1,
      desc,
      `${qtd} ${m.unidade || 'un'}`,
      `R$ ${formatCurrency(unit)}`,
      `R$ ${formatCurrency(subtotal)}`,
      m.instalarNoCliente ? 'Sim (Patrimônio)' : 'Consumo / Reparo'
    ];
  });

  if (materiaisRows.length === 0) {
    materiaisRows.push(['-', 'Nenhum material de estoque vinculado a esta OS (mão de obra pura)', '-', '-', 'R$ 0,00', '-']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descrição do Equipamento / Material', 'Qtd', 'V. Unit.', 'Subtotal', 'Destino']],
    body: materiaisRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 30 }
    },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── RESUMO FINANCEIRO & VALORES ───────────────────────────────────────────
  if (y > pageHeight - 55) {
    doc.addPage();
    y = 20;
  }

  const valorMateriais = parseFloat(os.valorMateriais) || 0;
  const valorMaoDeObra = parseFloat(os.valorMaoDeObra) || 0;
  const desconto = parseFloat(os.desconto) || 0;
  const valorTotal = parseFloat(os.valorTotal) || (valorMateriais + valorMaoDeObra - desconto);

  const boxWidth = (pageWidth - (margin * 2) - 6) / 2;

  // Box Esquerda: Garantia e Termos
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, 32, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TERMO DE GARANTIA E CONDIÇÕES', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('• Garantia de 90 dias sobre a mão de obra e instalação.', margin + 4, y + 11);
  doc.text('• Equipamentos novos possuem garantia legal de 12 meses.', margin + 4, y + 16);
  doc.text('• Não cobre danos por descargas atmosféricas ou vandalismo.', margin + 4, y + 21);
  if (os.orcamentoOrigemCodigo) {
    doc.text(`• Vinculada ao Orçamento Comercial #${os.orcamentoOrigemCodigo}`, margin + 4, y + 26);
  }

  // Box Direita: Valores (Fundo escuro com letras 100% brancas)
  const boxXDireita = margin + boxWidth + 6;
  doc.setFillColor(15, 23, 42); // slate-900 escuro
  doc.setDrawColor(30, 41, 59);
  doc.roundedRect(boxXDireita, y, boxWidth, 32, 2, 2, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Subtotal Equipamentos:', boxXDireita + 4, y + 7);
  doc.text(`R$ ${formatCurrency(valorMateriais)}`, boxXDireita + boxWidth - 4, y + 7, { align: 'right' });

  doc.text('Subtotal Serviços:', boxXDireita + 4, y + 13);
  doc.text(`R$ ${formatCurrency(valorMaoDeObra)}`, boxXDireita + boxWidth - 4, y + 13, { align: 'right' });

  if (desconto > 0) {
    doc.text('Desconto:', boxXDireita + 4, y + 19);
    doc.text(`- R$ ${formatCurrency(desconto)}`, boxXDireita + boxWidth - 4, y + 19, { align: 'right' });
  }

  doc.setDrawColor(71, 85, 105);
  doc.line(boxXDireita + 4, y + 21.5, boxXDireita + boxWidth - 4, y + 21.5);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VALOR TOTAL DA OS:', boxXDireita + 4, y + 28);
  doc.text(`R$ ${formatCurrency(valorTotal)}`, boxXDireita + boxWidth - 4, y + 28, { align: 'right' });

  y += 40;

  // ── ASSINATURAS DO TÉCNICO E CLIENTE ──────────────────────────────────────
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 25;
  }

  const signWidth = 72;
  const signLeftX = margin + 10;
  const signRightX = pageWidth - margin - signWidth - 10;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(signLeftX, y + 10, signLeftX + signWidth, y + 10);
  doc.line(signRightX, y + 10, signRightX + signWidth, y + 10);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(os.tecnicoNome || 'Técnico Responsável', signLeftX + (signWidth / 2), y + 14, { align: 'center' });
  doc.text('Assinatura do Técnico Executante', signLeftX + (signWidth / 2), y + 18, { align: 'center' });

  doc.text(os.clienteNome || 'Cliente / Responsável', signRightX + (signWidth / 2), y + 14, { align: 'center' });
  doc.text('Aceite e Recebimento dos Serviços', signRightX + (signWidth / 2), y + 18, { align: 'center' });

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Ordem de Serviço gerada em ${new Date().toLocaleString('pt-BR')} • Zeu-Tech - Sistema de Gestão`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const filename = `OS_${os.codigoOS || '00000'}_${(os.clienteNome || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
