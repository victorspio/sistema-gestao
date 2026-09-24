import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatters';
import { precarregarImagensPDF } from './pdfImageHelper';

export async function gerarPdfOrcamento(orcamento, dadosEmpresa = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // Pré-carrega imagens do cabeçalho
  const { mascote, logo } = await precarregarImagensPDF();

  // Dados da empresa com fallbacks da Zeu-Tech
  const nomeEmpresa = dadosEmpresa.nome || 'Zeu Tech';
  const cnpj = dadosEmpresa.cnpj || '66.819.439/0001-59';
  const endereco = dadosEmpresa.endereco || 'Jeronimo Batista, N: 4516';
  const telefone = dadosEmpresa.telefone || '(88) 9.9964-8656';
  const email = dadosEmpresa.email || 'zeutech.online@gmail.com';

  // ── CABEÇALHO 3 COLUNAS ───────────────────────────────────────────────────
  const headerH = 42; // altura do cabeçalho em mm

  // Fundo azul escuro
  doc.setFillColor(6, 13, 48);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Faixa ciano inferior
  doc.setFillColor(0, 200, 255);
  doc.rect(0, headerH - 1.5, pageWidth, 1.5, 'F');

  // ── COLUNA ESQUERDA: título + dados da empresa ────────────────────────────
  const colEsqX = margin;

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Proposta de Orçamento', colEsqX, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 235, 255);
  const linhaH = 5;
  doc.text(nomeEmpresa, colEsqX, 16);
  doc.text(`CNPJ: ${cnpj}`, colEsqX, 16 + linhaH);
  doc.text(`Endereço: ${endereco}`, colEsqX, 16 + linhaH * 2);
  doc.text(`Telefone: ${telefone}`, colEsqX, 16 + linhaH * 3);
  doc.text(`E-mail: ${email}`, colEsqX, 16 + linhaH * 4);

  // ── COLUNA CENTRO: mascote ────────────────────────────────────────────────
  if (mascote) {
    const mascW = 22;
    const mascH = 36;
    const mascX = (pageWidth - mascW) / 2;
    const mascY = headerH - mascH - 0; // pés alinhados com a faixa ciano
    doc.addImage(mascote, 'PNG', mascX, mascY, mascW, mascH);
  }

  // ── COLUNA DIREITA: logo ──────────────────────────────────────────────────
  if (logo) {
    const logoW = 46;
    const logoH = 34;
    const logoX = pageWidth - margin - logoW;
    const logoY = (headerH - logoH) / 2;
    doc.addImage(logo, 'PNG', logoX, logoY, logoW, logoH);
  }

  // Número do orçamento (abaixo do cabeçalho)
  const dataCriacao = orcamento.criadoEm?.toDate ? orcamento.criadoEm.toDate() : new Date(orcamento.criadoEm || Date.now());
  const validadeDias = orcamento.validadeDias || 15;
  const dataValidade = new Date(dataCriacao.getTime() + validadeDias * 24 * 60 * 60 * 1000);

  let y = headerH + 6;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`ORÇAMENTO #${orcamento.codigoOrcamento || '00000'}`, pageWidth - margin, y - 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${dataCriacao.toLocaleDateString('pt-BR')} | Válido até: ${dataValidade.toLocaleDateString('pt-BR')} (${validadeDias} dias)`, pageWidth - margin, y + 3, { align: 'right' });

  y += 8;


  // ── DADOS DO CLIENTE ──────────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 26, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('DADOS DO CLIENTE / LOCAL DE INSTALAÇÃO', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const clienteLinha1 = `Cliente: ${orcamento.clienteNome || 'Consumidor'} ${orcamento.clienteCpf ? `| CPF/CNPJ: ${orcamento.clienteCpf}` : ''}`;
  doc.text(clienteLinha1, margin + 4, y + 12);

  const clienteLinha2 = `Telefone / WhatsApp: ${orcamento.clienteTelefone || orcamento.clienteWhatsapp || 'Não informado'} | E-mail: ${orcamento.clienteEmail || '-'}`;
  doc.text(clienteLinha2, margin + 4, y + 17);

  const enderecoCompleto = [
    orcamento.clienteEndereco,
    orcamento.clienteComplemento,
    orcamento.clienteBairro,
    orcamento.clienteCidade ? `${orcamento.clienteCidade} - ${orcamento.clienteEstado || ''}` : '',
    orcamento.clienteCep ? `CEP: ${orcamento.clienteCep}` : ''
  ].filter(Boolean).join(', ') || 'Local a combinar';
  doc.text(`Local da Instalação: ${enderecoCompleto}`, margin + 4, y + 22);

  y += 32;

  // ── SEÇÃO 1: EQUIPAMENTOS E MATERIAIS ─────────────────────────────────────
  doc.setTextColor(0, 163, 209); // ciano médio Zeu-Tech
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. EQUIPAMENTOS E MATERIAIS', margin, y);
  y += 5;

  const produtos = orcamento.produtos || [];

  // Dimensões da tabela
  const tableWidth = pageWidth - margin * 2;
  const colImg = 22;  // coluna de imagem
  const colNum = 8;   // #
  const colQtd = 20;  // Qtd
  const colUnit = 26;  // Vlr. Unit.
  const colSub = 26;  // Subtotal
  const colDesc = tableWidth - colImg - colNum - colQtd - colUnit - colSub;
  const rowH = 20;  // altura de cada linha com imagem
  const tableHeaderH = 8;

  // Cabeçalho azul Zeu-Tech
  doc.setFillColor(0, 87, 184); // #0057b8
  doc.rect(margin, y, tableWidth, tableHeaderH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let cx = margin;
  doc.text('Img', cx + colImg / 2, y + 5.5, { align: 'center' }); cx += colImg;
  doc.text('#', cx + colNum / 2, y + 5.5, { align: 'center' }); cx += colNum;
  doc.text('Descrição do Equipamento / Material', cx + 2, y + 5.5); cx += colDesc;
  doc.text('Qtd', cx + colQtd / 2, y + 5.5, { align: 'center' }); cx += colQtd;
  doc.text('Vlr. Unit.', cx + colUnit / 2, y + 5.5, { align: 'center' }); cx += colUnit;
  doc.text('Subtotal', cx + colSub / 2, y + 5.5, { align: 'center' });

  y += tableHeaderH;

  if (produtos.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, tableWidth, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, tableWidth, rowH);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Nenhum equipamento listado para este orçamento.', margin + tableWidth / 2, y + rowH / 2 + 1, { align: 'center' });
    y += rowH;
  } else {
    for (let idx = 0; idx < produtos.length; idx++) {
      const item = produtos[idx];

      // Quebra de página antes de cada linha se necessário
      if (y + rowH > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Fundo zebrado
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(margin, y, tableWidth, rowH, 'F');

      // Borda inferior
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowH, margin + tableWidth, y + rowH);

      // Imagem do produto
      const imgPad = 1.5;
      const imgW = colImg - imgPad * 2;
      const imgH = rowH - imgPad * 2;
      if (item.imagemBase64) {
        try {
          doc.addImage(item.imagemBase64, 'JPEG', margin + imgPad, y + imgPad, imgW, imgH, undefined, 'FAST');
        } catch (_) { /* imagem inválida, deixa em branco */ }
      } else {
        // Placeholder tracejado quando sem imagem
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([1, 1], 0);
        doc.rect(margin + imgPad, y + imgPad, imgW, imgH);
        doc.setLineDashPattern([], 0);
      }

      // Textos da linha
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      const qtd = parseFloat(item.quantidade) || 0;
      const unit = parseFloat(item.valorUnitario) || 0;
      const sub = qtd * unit;

      const descProduto = [
        item.nome || item.produtoNome || 'Equipamento',
        item.marca ? `Marca: ${item.marca}` : '',
        item.modelo ? `Mod: ${item.modelo}` : '',
      ].filter(Boolean).join(' | ');

      // Truncar descrição para caber na coluna
      const descTrunc = doc.splitTextToSize(descProduto, colDesc - 4);

      cx = margin + colImg;
      const midY = y + rowH / 2 + 1;

      // #
      doc.setFont('helvetica', 'bold');
      doc.text(String(idx + 1), cx + colNum / 2, midY, { align: 'center' });
      cx += colNum;

      // Descrição (até 2 linhas)
      doc.setFont('helvetica', 'normal');
      const lineH = 3.5;
      const startDescY = descTrunc.length === 1 ? midY : y + rowH / 2 - lineH / 2;
      descTrunc.slice(0, 2).forEach((line, li) => {
        doc.text(line, cx + 2, startDescY + li * (lineH + 0.5));
      });
      cx += colDesc;

      // Qtd
      doc.text(`${qtd} ${item.unidade || 'un'}`, cx + colQtd / 2, midY, { align: 'center' });
      cx += colQtd;

      // Vlr. Unit.
      doc.text(`R$ ${formatCurrency(unit)}`, cx + colUnit - 2, midY, { align: 'right' });
      cx += colUnit;

      // Subtotal (negrito)
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${formatCurrency(sub)}`, cx + colSub - 2, midY, { align: 'right' });

      y += rowH;
    }
  }

  y += 8;

  // Checa quebra de página
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }


  // ── SEÇÃO 2: SERVIÇOS E MÃO DE OBRA ───────────────────────────────────────
  doc.setTextColor(0, 163, 209); // ciano médio Zeu-Tech
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. SERVIÇOS TÉCNICOS E INSTALAÇÃO', margin, y);
  y += 3;

  const servicosRows = (orcamento.servicos || []).map((serv, idx) => {
    const qtd = parseFloat(serv.quantidade) || 1;
    const unit = parseFloat(serv.valorUnitario) || 0;
    const subtotal = qtd * unit;

    return [
      idx + 1,
      serv.descricao || 'Serviço técnico especializado',
      qtd,
      `R$ ${formatCurrency(unit)}`,
      `R$ ${formatCurrency(subtotal)}`
    ];
  });

  if (servicosRows.length === 0) {
    servicosRows.push(['-', 'Instalação / Configuração inclusa ou não especificada.', '1', 'R$ 0,00', 'R$ 0,00']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Descrição do Serviço Técnico', 'Qtd', 'Vlr. Unitário', 'Subtotal']],
    body: servicosRows,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Checa quebra de página
  if (y > pageHeight - 75) {
    doc.addPage();
    y = 20;
  }

  // ── RESUMO FINANCEIRO & CONDIÇÕES ─────────────────────────────────────────
  const subtotalProd = parseFloat(orcamento.subtotalProdutos) || 0;
  const subtotalServ = parseFloat(orcamento.subtotalServicos) || 0;
  const desconto = parseFloat(orcamento.desconto) || 0;
  const valorTotal = parseFloat(orcamento.valorTotal) || 0;

  // Box Esquerda: Condições e Garantia
  const boxWidth = (pageWidth - (margin * 2) - 6) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, 36, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONDIÇÕES E PRAZOS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`• Condições de Pagamento: ${orcamento.condicoesPagamento || 'A combinar'}`, margin + 4, y + 12);
  doc.text(`• Prazo de Execução: ${orcamento.prazoExecucao || 'Conforme agendamento'}`, margin + 4, y + 18);
  doc.text(`• Garantia: 12 meses para equipamentos | 90 dias instalação`, margin + 4, y + 24);
  if (orcamento.observacoes) {
    doc.text(`• Obs: ${orcamento.observacoes.slice(0, 75)}`, margin + 4, y + 30);
  }

  // Box Direita: Totais Financeiros (Fundo escuro com letras 100% brancas)
  const boxXDireita = margin + boxWidth + 6;
  doc.setFillColor(15, 23, 42); // slate-900 escuro
  doc.setDrawColor(30, 41, 59);
  doc.roundedRect(boxXDireita, y, boxWidth, 36, 2, 2, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal Equipamentos:', boxXDireita + 4, y + 8);
  doc.text(`R$ ${formatCurrency(subtotalProd)}`, boxXDireita + boxWidth - 4, y + 8, { align: 'right' });

  doc.text('Subtotal Serviços:', boxXDireita + 4, y + 14);
  doc.text(`R$ ${formatCurrency(subtotalServ)}`, boxXDireita + boxWidth - 4, y + 14, { align: 'right' });

  if (desconto > 0) {
    doc.text('Desconto Especial:', boxXDireita + 4, y + 20);
    doc.text(`- R$ ${formatCurrency(desconto)}`, boxXDireita + boxWidth - 4, y + 20, { align: 'right' });
  }

  doc.setDrawColor(71, 85, 105);
  doc.line(boxXDireita + 4, y + 23, boxXDireita + boxWidth - 4, y + 23);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('VALOR TOTAL:', boxXDireita + 4, y + 31);
  doc.text(`R$ ${formatCurrency(valorTotal)}`, boxXDireita + boxWidth - 4, y + 31, { align: 'right' });

  y += 46;

  // ── ASSINATURA / ACEITE DO CLIENTE ────────────────────────────────────────
  if (y > pageHeight - 35) {
    doc.addPage();
    y = 25;
  }

  const signWidth = 70;
  const signLeftX = margin + 10;
  const signRightX = pageWidth - margin - signWidth - 10;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(signLeftX, y + 12, signLeftX + signWidth, y + 12);
  doc.line(signRightX, y + 12, signRightX + signWidth, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(nomeEmpresa, signLeftX + (signWidth / 2), y + 16, { align: 'center' });
  doc.text('Responsável Técnico / Contratada', signLeftX + (signWidth / 2), y + 20, { align: 'center' });

  doc.text(orcamento.clienteNome || 'Cliente / Contratante', signRightX + (signWidth / 2), y + 16, { align: 'center' });
  doc.text('De acordo e Aceite da Proposta', signRightX + (signWidth / 2), y + 20, { align: 'center' });

  // ── RODAPÉ ────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} • Zeu-Tech - Sistema de Gestão`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const filename = `Orcamento_${orcamento.codigoOrcamento || 'proposta'}_${(orcamento.clienteNome || 'cliente').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
