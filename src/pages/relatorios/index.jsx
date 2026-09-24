import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  Users,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  RotateCcw,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Percent,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import PageLayout from '../../components/layout-new/PageLayout';
import { useOrdensServico } from '../../hooks/useOrdensServico';
import { useOrcamentos } from '../../hooks/useOrcamentos';
import { useEstoque } from '../../hooks/useEstoque';
import { useFinanceiro } from '../../hooks/useFinanceiro';
import { useClientes } from '../../hooks/useClientes';
import { useCompras } from '../../hooks/useCompras';
import { useVendas } from '../../hooks/useVendas';
import { formatCurrency, formatarData } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';
import { exportarDashboardPDF, exportarDashboardCSV } from './utils/exportarDashboard';

// Cores harmoniosas do Design System Zeu-Tech
const PALETA_CORES = [
  '#00c8ff', // Ciano Zeu-Tech
  '#0057b8', // Azul Royal
  '#8b5cf6', // Roxo / Violeta
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Âmbar
  '#f43f5e', // Rosa / Coral
  '#06b6d4', // Teal
  '#6366f1'  // Indigo
];

const STATUS_OS_BADGE = {
  aberta:              { label: 'Aberta',              bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  agendada:            { label: 'Agendada',            bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  em_andamento:        { label: 'Em Andamento',        bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  aguardando_material: { label: 'Aguardando Mat.',     bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  concluida:           { label: 'Concluída',           bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelada:           { label: 'Cancelada',           bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
};

export default function RelatoriosPage() {
  // Hooks reais do sistema
  const { ordensServico = [], listarOrdensServico } = useOrdensServico();
  const { orcamentos = [], listarOrcamentos } = useOrcamentos();
  const { produtos = [], listarProdutos } = useEstoque();
  const { contasReceber = [], contasPagar = [], fluxoCaixa = [], listarContasReceber, listarContasPagar, listarFluxoCaixa } = useFinanceiro();
  const { clientes = [], listarClientes } = useClientes();
  const { compras = [], listarCompras } = useCompras();
  const { vendas = [], listarVendas } = useVendas();

  const [loadingGeral, setLoadingGeral] = useState(true);

  // Estados dos Filtros
  const [periodo, setPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoRelatorio, setTipoRelatorio] = useState('todos');
  const [clienteFiltro, setClienteFiltro] = useState('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');

  // Estado do dropdown de exportação
  const [dropdownExportarAberto, setDropdownExportarAberto] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Carregamento de dados inicial
  useEffect(() => {
    async function carregarTodosDados() {
      try {
        setLoadingGeral(true);
        await Promise.all([
          listarOrdensServico(),
          listarOrcamentos(),
          listarProdutos(),
          listarContasReceber(),
          listarContasPagar(),
          listarFluxoCaixa(),
          listarClientes(),
          listarCompras(),
          listarVendas()
        ]);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard de relatórios:', err);
      } finally {
        setLoadingGeral(false);
      }
    }
    carregarTodosDados();
  }, []);

  // Extrair lista única de categorias reais dos produtos
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set();
    produtos.forEach(p => {
      if (p.categoria && p.categoria.trim()) cats.add(p.categoria.trim());
    });
    return Array.from(cats);
  }, [produtos]);

  // Função para calcular o intervalo de datas do período selecionado
  const intervaloData = useMemo(() => {
    const hoje = new Date();
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    let inicio = new Date();

    switch (periodo) {
      case 'hoje':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
        break;
      case 'ontem': {
        const d = new Date(hoje);
        d.setDate(d.getDate() - 1);
        inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const fimOntem = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        return { inicio, fim: fimOntem, texto: 'Ontem' };
      }
      case '7dias':
        inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        break;
      case '30dias':
        inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 30);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'mes_anterior': {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 0, 0, 0, 0);
        const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);
        return { inicio, fim: ultimoDiaMesAnterior, texto: 'Mês anterior' };
      }
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'personalizado':
        if (dataInicio) {
          const dIni = new Date(dataInicio + 'T00:00:00');
          const dFim = dataFim ? new Date(dataFim + 'T23:59:59') : fim;
          return {
            inicio: dIni,
            fim: dFim,
            texto: `${formatarData(dIni)} a ${formatarData(dFim)}`
          };
        }
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
        break;
      default:
        inicio = new Date(2020, 0, 1);
    }

    const mapaTextos = {
      hoje: 'Hoje',
      '7dias': 'Últimos 7 dias',
      '30dias': 'Últimos 30 dias',
      mes: 'Este mês',
      ano: 'Este ano',
      todos: 'Todo o histórico'
    };

    return { inicio, fim, texto: mapaTextos[periodo] || 'Período Selecionado' };
  }, [periodo, dataInicio, dataFim]);

  // Função auxiliar para normalizar e converter qualquer data do Firebase
  const extrairData = (doc) => {
    if (!doc) return null;
    const raw = doc.dataConclusao || doc.dataVenda || doc.dataCompra || doc.dataPagamento || doc.dataAgendamento || doc.dataAbertura || doc.criadoEm || doc.createdAt;
    if (!raw) return null;
    if (raw instanceof Date) return raw;
    if (typeof raw.toDate === 'function') return raw.toDate();
    if (typeof raw === 'string') {
      if (raw.includes('/')) {
        const [d, m, y] = raw.split('/');
        return new Date(`${y}-${m}-${d}`);
      }
      return new Date(raw);
    }
    return new Date(raw);
  };

  // Filtragem dos dados conforme o período e seletores
  const dadosFiltrados = useMemo(() => {
    const { inicio, fim } = intervaloData;

    // 1. Ordens de Serviço
    const osNoPeriodo = ordensServico.filter(os => {
      const dt = extrairData(os);
      if (dt && (dt < inicio || dt > fim)) return false;
      if (clienteFiltro !== 'todos' && os.clienteId !== clienteFiltro && os.clienteNome !== clienteFiltro) return false;
      return true;
    });

    // 2. Orçamentos
    const orcNoPeriodo = orcamentos.filter(orc => {
      const dt = extrairData(orc);
      if (dt && (dt < inicio || dt > fim)) return false;
      if (clienteFiltro !== 'todos' && orc.clienteId !== clienteFiltro && orc.clienteNome !== clienteFiltro) return false;
      return true;
    });

    // 3. Vendas Balcão
    const vendasNoPeriodo = vendas.filter(v => {
      const dt = extrairData(v);
      if (dt && (dt < inicio || dt > fim)) return false;
      if (clienteFiltro !== 'todos' && v.clienteId !== clienteFiltro) return false;
      return true;
    });

    // 4. Compras (Reposição de Estoque)
    const comprasNoPeriodo = compras.filter(c => {
      const dt = extrairData(c);
      if (dt && (dt < inicio || dt > fim)) return false;
      return true;
    });

    // 5. Contas a Receber
    const receberNoPeriodo = contasReceber.filter(c => {
      const dt = extrairData(c);
      if (dt && (dt < inicio || dt > fim)) return false;
      if (clienteFiltro !== 'todos' && c.clienteId !== clienteFiltro) return false;
      return true;
    });

    // 6. Contas a Pagar
    const pagarNoPeriodo = contasPagar.filter(c => {
      const dt = extrairData(c);
      if (dt && (dt < inicio || dt > fim)) return false;
      return true;
    });

    // 7. Fluxo de Caixa
    const fluxoNoPeriodo = fluxoCaixa.filter(f => {
      const dt = extrairData(f);
      if (dt && (dt < inicio || dt > fim)) return false;
      return true;
    });

    return {
      ordensServico: osNoPeriodo,
      orcamentos: orcNoPeriodo,
      vendas: vendasNoPeriodo,
      compras: comprasNoPeriodo,
      contasReceber: receberNoPeriodo,
      contasPagar: pagarNoPeriodo,
      fluxoCaixa: fluxoNoPeriodo
    };
  }, [
    ordensServico,
    orcamentos,
    vendas,
    compras,
    contasReceber,
    contasPagar,
    fluxoCaixa,
    intervaloData,
    clienteFiltro
  ]);

  // CÁLCULO DAS MÉTRICAS E INDICADORES CONSOLIDADOS
  const metricas = useMemo(() => {
    // 1. Receita:
    // OS concluídas/faturadas + Vendas Balcão + Contas recebidas (sem duplicar OS) + Entradas de Caixa
    const receitaOS = dadosFiltrados.ordensServico
      .filter(os => os.status === 'concluida' || os.financeiroLancado)
      .reduce((acc, os) => acc + (parseFloat(os.valorTotal) || 0), 0);

    const receitaVendas = dadosFiltrados.vendas
      .filter(v => v.status !== 'cancelada')
      .reduce((acc, v) => acc + (parseFloat(v.valorTotal) || 0), 0);

    // Contas a receber pagas avulsas (que não vieram de OS ou venda já somadas)
    const contasPagasAvulsas = dadosFiltrados.contasReceber
      .filter(c => c.status === 'pago' && !c.osId && !c.vendaId)
      .reduce((acc, c) => acc + (parseFloat(c.valorRecebido || c.valor) || 0), 0);

    const receitaTotal = receitaOS + receitaVendas + contasPagasAvulsas;

    // 2. Despesas:
    // Compras de produtos + Contas pagas + Saídas de Caixa
    const despesasCompras = dadosFiltrados.compras
      .reduce((acc, c) => acc + (parseFloat(c.valorTotal) || 0), 0);

    const despesasContasPagar = dadosFiltrados.contasPagar
      .filter(c => c.status === 'paga' || c.status === 'pago')
      .reduce((acc, c) => acc + (parseFloat(c.valorPago || c.valor) || 0), 0);

    const despesasCaixa = dadosFiltrados.fluxoCaixa
      .filter(f => f.tipo === 'saida' && !f.contaPagarRef && !f.compraId)
      .reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0);

    const despesasTotal = despesasCompras + despesasContasPagar + despesasCaixa;

    // 3. Resultado / Lucro
    const lucroLiquido = receitaTotal - despesasTotal;
    const margemLucro = receitaTotal > 0 ? ((lucroLiquido / receitaTotal) * 100).toFixed(1) : 0;

    // 4. Orçamentos
    const totalOrcamentos = dadosFiltrados.orcamentos.length;
    const orcamentosAprovados = dadosFiltrados.orcamentos.filter(o => o.status === 'aprovado').length;
    const orcamentosEmNegociacao = dadosFiltrados.orcamentos.filter(o => o.status === 'aguardando' || o.status === 'enviado').length;
    const taxaConversaoOrc = totalOrcamentos > 0 ? ((orcamentosAprovados / totalOrcamentos) * 100).toFixed(0) : 0;

    // 5. Ordens de Serviço
    const totalOS = dadosFiltrados.ordensServico.length;
    const osConcluidas = dadosFiltrados.ordensServico.filter(o => o.status === 'concluida').length;
    const osEmAndamento = dadosFiltrados.ordensServico.filter(o => o.status === 'em_andamento' || o.status === 'agendada' || o.status === 'aberta').length;

    // 6. Produtos & Materiais utilizados
    let totalMateriaisUsados = 0;
    let valorMateriaisUsados = 0;
    dadosFiltrados.ordensServico.forEach(os => {
      (os.materiaisUtilizados || []).forEach(m => {
        const qtd = parseFloat(m.quantidade) || 0;
        totalMateriaisUsados += qtd;
        valorMateriaisUsados += qtd * (parseFloat(m.valorUnitario) || 0);
      });
    });

    dadosFiltrados.vendas.forEach(v => {
      (v.itens || []).forEach(it => {
        totalMateriaisUsados += parseFloat(it.quantidade) || 0;
      });
    });

    // 7. Situação Financeira (Global / Contas a Receber e Pagar)
    const hojeStr = new Date().toISOString().split('T')[0];

    const receberVencidas = contasReceber
      .filter(c => c.status === 'pendente' && c.dataVencimento && (c.dataVencimento < hojeStr || (c.dataVencimento.toDate && c.dataVencimento.toDate() < new Date())))
      .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

    const receberPendentes = contasReceber
      .filter(c => c.status === 'pendente')
      .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

    const receberPagas = contasReceber
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + (parseFloat(c.valorRecebido || c.valor) || 0), 0);

    const pagarVencidas = contasPagar
      .filter(c => c.status === 'pendente' && c.dataVencimento && c.dataVencimento < hojeStr)
      .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

    const pagarPendentes = contasPagar
      .filter(c => c.status === 'pendente')
      .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

    const pagarPagas = contasPagar
      .filter(c => c.status === 'paga' || c.status === 'pago')
      .reduce((acc, c) => acc + (parseFloat(c.valorPago || c.valor) || 0), 0);

    return {
      receitaTotal,
      receitaOS,
      receitaVendas,
      despesasTotal,
      lucroLiquido,
      margemLucro,
      totalOrcamentos,
      orcamentosAprovados,
      orcamentosEmNegociacao,
      taxaConversaoOrc,
      totalOS,
      osConcluidas,
      osEmAndamento,
      totalMateriaisUsados,
      valorMateriaisUsados,
      receberVencidas,
      receberPendentes,
      receberPagas,
      pagarVencidas,
      pagarPendentes,
      pagarPagas
    };
  }, [dadosFiltrados, contasReceber, contasPagar]);

  // PRODUTOS COM ESTOQUE BAIXO (Dados Reais)
  const produtosEstoqueBaixo = useMemo(() => {
    return produtos
      .filter(p => (parseFloat(p.quantidade) || 0) <= (parseFloat(p.estoqueMinimo) || 5))
      .sort((a, b) => (parseFloat(a.quantidade) || 0) - (parseFloat(b.quantidade) || 0));
  }, [produtos]);

  // GRÁFICO 1: EVOLUÇÃO TEMPORAL (Receita vs Despesas ao longo do tempo)
  const dadosGraficoEvolucao = useMemo(() => {
    const mapaDias = {};

    // Inicializar pontos
    const { inicio, fim } = intervaloData;
    const diffDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));

    // Agrupa por dia se o período for até 60 dias, senão por mês
    const agruparPorMes = diffDias > 60;

    // Preenche com as OS
    dadosFiltrados.ordensServico.forEach(os => {
      const dt = extrairData(os);
      if (!dt) return;
      const chave = agruparPorMes
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

      if (!mapaDias[chave]) mapaDias[chave] = { label: chave, Receita: 0, Despesas: 0, Servicos: 0 };
      if (os.status === 'concluida' || os.financeiroLancado) {
        const val = parseFloat(os.valorTotal) || 0;
        mapaDias[chave].Receita += val;
        mapaDias[chave].Servicos += parseFloat(os.valorMaoDeObra) || val;
      }
    });

    // Preenche com as Vendas Balcão
    dadosFiltrados.vendas.forEach(v => {
      const dt = extrairData(v);
      if (!dt) return;
      const chave = agruparPorMes
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

      if (!mapaDias[chave]) mapaDias[chave] = { label: chave, Receita: 0, Despesas: 0, Servicos: 0 };
      mapaDias[chave].Receita += parseFloat(v.valorTotal) || 0;
    });

    // Preenche com Compras e Despesas
    dadosFiltrados.compras.forEach(c => {
      const dt = extrairData(c);
      if (!dt) return;
      const chave = agruparPorMes
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

      if (!mapaDias[chave]) mapaDias[chave] = { label: chave, Receita: 0, Despesas: 0, Servicos: 0 };
      mapaDias[chave].Despesas += parseFloat(c.valorTotal) || 0;
    });

    dadosFiltrados.contasPagar.forEach(cp => {
      if (cp.status !== 'paga' && cp.status !== 'pago') return;
      const dt = extrairData(cp);
      if (!dt) return;
      const chave = agruparPorMes
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
        : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;

      if (!mapaDias[chave]) mapaDias[chave] = { label: chave, Receita: 0, Despesas: 0, Servicos: 0 };
      mapaDias[chave].Despesas += parseFloat(cp.valorPago || cp.valor) || 0;
    });

    const lista = Object.values(mapaDias);

    // Se estiver vazio, adiciona ponto padrão do período
    if (lista.length === 0) {
      return [
        { label: 'Início', Receita: 0, Despesas: 0, Servicos: 0 },
        { label: 'Hoje', Receita: 0, Despesas: 0, Servicos: 0 }
      ];
    }

    return lista;
  }, [dadosFiltrados, intervaloData]);

  // GRÁFICO 2: DISTRIBUIÇÃO POR CATEGORIA
  const dadosGraficoCategorias = useMemo(() => {
    const mapaCat = {};

    // 1. Materiais utilizados nas OS agrupados por categoria do produto
    dadosFiltrados.ordensServico.forEach(os => {
      // Mão de obra / Serviços prestados
      const valMaoObra = parseFloat(os.valorMaoDeObra) || 0;
      if (valMaoObra > 0) {
        mapaCat['Serviços e Instalações'] = (mapaCat['Serviços e Instalações'] || 0) + valMaoObra;
      }

      (os.materiaisUtilizados || []).forEach(m => {
        const prod = produtos.find(p => p.id === m.produtoId);
        const cat = prod?.categoria || m.categoria || 'CFTV e Equipamentos';
        const subtotal = (parseFloat(m.quantidade) || 1) * (parseFloat(m.valorUnitario) || 0);
        mapaCat[cat] = (mapaCat[cat] || 0) + subtotal;
      });
    });

    // 2. Vendas Balcão
    dadosFiltrados.vendas.forEach(v => {
      (v.itens || []).forEach(it => {
        const prod = produtos.find(p => p.id === it.produtoId);
        const cat = prod?.categoria || 'Produtos Balcão';
        const subtotal = (parseFloat(it.quantidade) || 1) * (parseFloat(it.valorUnitario) || 0);
        mapaCat[cat] = (mapaCat[cat] || 0) + subtotal;
      });
    });

    // Se não houver vendas no período, preenche com as categorias do cadastro
    if (Object.keys(mapaCat).length === 0) {
      produtos.forEach(p => {
        const cat = p.categoria || 'Geral';
        mapaCat[cat] = (mapaCat[cat] || 0) + (parseFloat(p.quantidade) || 0) * (parseFloat(p.precoVenda) || 0);
      });
    }

    return Object.entries(mapaCat).map(([name, value]) => ({
      name,
      value: Math.round(value)
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [dadosFiltrados, produtos]);

  // GRÁFICO 3: MOVIMENTAÇÃO DE ESTOQUE (ENTRADAS X SAÍDAS)
  const dadosGraficoEstoque = useMemo(() => {
    let entradasTotalQtd = 0;
    let saidasTotalQtd = 0;
    let entradasTotalValor = 0;
    let saidasTotalValor = 0;

    // Entradas via Compras
    dadosFiltrados.compras.forEach(c => {
      entradasTotalQtd += parseFloat(c.quantidade) || 1;
      entradasTotalValor += parseFloat(c.valorTotal) || 0;
    });

    // Saídas via OS
    dadosFiltrados.ordensServico.forEach(os => {
      (os.materiaisUtilizados || []).forEach(m => {
        const qtd = parseFloat(m.quantidade) || 0;
        saidasTotalQtd += qtd;
        saidasTotalValor += qtd * (parseFloat(m.valorUnitario) || 0);
      });
    });

    // Saídas via Vendas
    dadosFiltrados.vendas.forEach(v => {
      (v.itens || []).forEach(it => {
        const qtd = parseFloat(it.quantidade) || 0;
        saidasTotalQtd += qtd;
        saidasTotalValor += qtd * (parseFloat(it.valorUnitario) || 0);
      });
    });

    return [
      {
        tipo: 'Itens Movimentados',
        Entradas: Math.round(entradasTotalQtd),
        Saídas: Math.round(saidasTotalQtd)
      },
      {
        tipo: 'Volume Financeiro (R$)',
        Entradas: Math.round(entradasTotalValor),
        Saídas: Math.round(saidasTotalValor)
      }
    ];
  }, [dadosFiltrados]);

  // Exportar Relatório em PDF
  const handleExportarPDF = async () => {
    try {
      setExportando(true);
      setDropdownExportarAberto(false);
      await exportarDashboardPDF({
        metricas,
        ordensServico: dadosFiltrados.ordensServico,
        produtosEstoqueBaixo,
        periodoTexto: intervaloData.texto,
        tipoFiltro: tipoRelatorio
      });
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Erro ao gerar relatório PDF: ' + err.message);
    } finally {
      setExportando(false);
    }
  };

  // Exportar Relatório em CSV / Excel
  const handleExportarCSV = () => {
    try {
      setDropdownExportarAberto(false);
      exportarDashboardCSV({
        metricas,
        ordensServico: dadosFiltrados.ordensServico,
        produtosEstoqueBaixo,
        periodoTexto: intervaloData.texto
      });
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      alert('Erro ao exportar CSV: ' + err.message);
    }
  };

  // Limpar Filtros
  const handleLimparFiltros = () => {
    setPeriodo('mes');
    setDataInicio('');
    setDataFim('');
    setTipoRelatorio('todos');
    setClienteFiltro('todos');
    setCategoriaFiltro('todos');
  };

  return (
    <PageLayout title="Relatórios">
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* =========================================================================
            1. CABEÇALHO DA PÁGINA
        ========================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-[#00c8ff]/10 text-[#00a3d1] dark:text-[#00c8ff] rounded-xl">
                <FileText size={22} />
              </span>
              Relatórios & Análise de Desempenho
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Obtenha uma visão completa do desempenho, faturamento e da operação da sua empresa.
            </p>
          </div>

          {/* BOTÃO EXPORTAR COM DROPDOWN */}
          <div className="relative self-start md:self-auto">
            <button
              onClick={() => setDropdownExportarAberto(!dropdownExportarAberto)}
              disabled={exportando || loadingGeral}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0057b8] to-[#00c8ff] hover:opacity-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all whitespace-nowrap disabled:opacity-50"
            >
              <Download size={17} />
              <span>{exportando ? 'Exportando...' : 'Exportar Relatório'}</span>
              <ChevronDown size={15} className={`transition-transform duration-200 ${dropdownExportarAberto ? 'rotate-180' : ''}`} />
            </button>

            {dropdownExportarAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-fadeIn">
                <button
                  onClick={handleExportarPDF}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5"
                >
                  <FileText size={16} className="text-red-500" />
                  <div>
                    <span className="font-semibold block">Relatório em PDF</span>
                    <span className="text-[10px] text-slate-400">Documento formatado para impressão</span>
                  </div>
                </button>
                <button
                  onClick={handleExportarCSV}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-700/60"
                >
                  <Download size={16} className="text-emerald-500" />
                  <div>
                    <span className="font-semibold block">Exportar para Excel / CSV</span>
                    <span className="text-[10px] text-slate-400">Planilha de dados completa</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. FILTROS AVANÇADOS
        ========================================================================== */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <Filter size={16} className="text-[#00c8ff]" />
              <span>Filtrar Análise Operacional</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Período ativo: <strong className="text-slate-700 dark:text-slate-200">{intervaloData.texto}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. PERÍODO */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00c8ff]"
              >
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="mes">Este mês</option>
                <option value="mes_anterior">Mês anterior</option>
                <option value="ano">Este ano</option>
                <option value="personalizado">Personalizado...</option>
                <option value="todos">Todo o Histórico</option>
              </select>
            </div>

            {/* 2. TIPO DE RELATÓRIO */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00c8ff]"
              >
                <option value="todos">Todos os Módulos</option>
                <option value="ordens_servico">Ordens de Serviço</option>
                <option value="orcamentos">Orçamentos & Propostas</option>
                <option value="vendas">Vendas</option>
                <option value="estoque">Estoque & Produtos</option>
                <option value="financeiro">Financeiro (Receitas & Despesas)</option>
              </select>
            </div>

            {/* 3. CLIENTE */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Cliente
              </label>
              <select
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00c8ff] truncate"
              >
                <option value="todos">Todos os Clientes</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cidade ? `(${c.cidade})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. CATEGORIA */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Categoria de Produto / Serviço
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#00c8ff] truncate"
              >
                <option value="todos">Todas as Categorias</option>
                {categoriasDisponiveis.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CAMPOS DE DATA QUANDO SELECIONADO PERSONALIZADO */}
          {periodo === 'personalizado' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* BOTÕES DE AÇÃO DOS FILTROS */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={handleLimparFiltros}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <RotateCcw size={14} />
              Limpar Filtros
            </button>
            <div className="px-3 py-1.5 bg-[#00c8ff]/10 text-[#00a3d1] dark:text-[#00c8ff] rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <Check size={14} />
              Filtro Aplicado
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loadingGeral ? (
          <div className="p-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <LoadingSpinner size="lg" text="Consolidando dados e indicadores operacionais..." />
          </div>
        ) : (
          <>
            {/* =========================================================================
                3. CARDS DE INDICADORES (6 CARDS ESTRUTURADOS)
            ========================================================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* CARD 1: RECEITA TOTAL */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Receita Total</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    R$ {formatCurrency(metricas.receitaTotal)}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    Entradas confirmadas
                  </p>
                </div>
              </div>

              {/* CARD 2: DESPESAS TOTAIS */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Despesas Totais</span>
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <ArrowDownRight size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    R$ {formatCurrency(metricas.despesasTotal)}
                  </h3>
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    Compras e saídas
                  </p>
                </div>
              </div>

              {/* CARD 3: RESULTADO / LUCRO */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Resultado / Lucro</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    metricas.lucroLiquido >= 0 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                  }`}>
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className={`text-xl sm:text-2xl font-extrabold ${
                    metricas.lucroLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                  }`}>
                    R$ {formatCurrency(metricas.lucroLiquido)}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Margem: <strong className="text-slate-700 dark:text-slate-200">{metricas.margemLucro}%</strong>
                  </p>
                </div>
              </div>

              {/* CARD 4: ORÇAMENTOS */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Orçamentos</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {metricas.totalOrcamentos}
                  </h3>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                    {metricas.orcamentosAprovados} aprovados ({metricas.taxaConversaoOrc}%)
                  </p>
                </div>
              </div>

              {/* CARD 5: ORDENS DE SERVIÇO */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ordens de Serviço</span>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#00a3d1] dark:text-[#00c8ff] flex items-center justify-center">
                    <Wrench size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {metricas.totalOS}
                  </h3>
                  <p className="text-[11px] text-[#00a3d1] dark:text-[#00c8ff] font-medium mt-1">
                    {metricas.osConcluidas} concluídas &bull; {metricas.osEmAndamento} ativas
                  </p>
                </div>
              </div>

              {/* CARD 6: PRODUTOS / MATERIAIS */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Itens Utilizados</span>
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {metricas.totalMateriaisUsados}
                  </h3>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium mt-1">
                    Itens em OS e vendas
                  </p>
                </div>
              </div>
            </div>

            {/* =========================================================================
                4. GRÁFICOS: EVOLUÇÃO TEMPORAL + CATEGORIAS + ESTOQUE
            ========================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* GRÁFICO 1: EVOLUÇÃO (LINHA / ÁREA) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#00c8ff]" />
                      Desempenho no Período
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evolução de faturamento, despesas e serviços executados.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-[#10b981]" /> Receita
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-[#ef4444]" /> Despesas
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" /> Serviços
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGraficoEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradServico" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `R$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip
                        formatter={(value, name) => [`R$ ${formatCurrency(value)}`, name]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradReceita)" />
                      <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gradDespesa)" />
                      <Area type="monotone" dataKey="Servicos" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#gradServico)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO 2: DISTRIBUIÇÃO POR CATEGORIA (DONUT) */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers size={18} className="text-[#00c8ff]" />
                    Vendas & Serviços por Categoria
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Composição do faturamento por segmento no período.
                  </p>
                </div>

                <div className="h-60 w-full relative flex items-center justify-center">
                  {dadosGraficoCategorias.length === 0 ? (
                    <div className="text-center text-xs text-slate-400">Sem dados para o período</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosGraficoCategorias}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dadosGraficoCategorias.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PALETA_CORES[index % PALETA_CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => [`R$ ${formatCurrency(val)}`, 'Valor']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* LEGENDA CUSTOMIZADA DA ROSCA */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 max-h-32 overflow-y-auto">
                  {dadosGraficoCategorias.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETA_CORES[idx % PALETA_CORES.length] }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-100 font-semibold ml-2">
                        R$ {formatCurrency(item.value)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GRÁFICO 3: ENTRADAS X SAÍDAS DE ESTOQUE (BARRAS) */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package size={18} className="text-orange-500" />
                    Movimentação de Estoque: Entradas x Saídas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparativo de aquisições de reposição vs materiais consumidos em campo.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-md bg-[#00c8ff]" /> Entradas
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-md bg-[#ea580c]" /> Saídas
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGraficoEstoque} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val, name) => [val, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Entradas" fill="#00c8ff" radius={[6, 6, 0, 0]} maxBarSize={55} />
                    <Bar dataKey="Saídas" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={55} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* =========================================================================
                5. TABELAS E RESUMOS OPERACIONAIS
            ========================================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TABELA 1: ÚLTIMAS ORDENS DE SERVIÇO */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wrench size={18} className="text-[#00c8ff]" />
                      Últimas Ordens de Serviço no Período
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Chamados técnicos e instalações atendidas pela equipe.
                    </p>
                  </div>
                  <Link
                    to="/ordens-servico"
                    className="text-xs font-semibold text-[#00a3d1] dark:text-[#00c8ff] hover:underline flex items-center gap-1"
                  >
                    <span>Ver todas</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {dadosFiltrados.ordensServico.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    Nenhuma ordem de serviço registrada no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[620px] w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-3.5 py-2.5">OS</th>
                          <th className="px-3.5 py-2.5">Cliente</th>
                          <th className="px-3.5 py-2.5">Técnico</th>
                          <th className="px-3.5 py-2.5">Data</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {dadosFiltrados.ordensServico.slice(0, 6).map(os => {
                          const badge = STATUS_OS_BADGE[os.status] || STATUS_OS_BADGE.aberta;
                          return (
                            <tr key={os.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                              <td className="px-3.5 py-3 font-bold text-orange-600 dark:text-orange-400">
                                #{os.codigoOS || '00000'}
                              </td>
                              <td className="px-3.5 py-3 font-medium text-slate-800 dark:text-slate-200">
                                {os.clienteNome || 'Cliente'}
                              </td>
                              <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400">
                                {os.tecnicoNome || 'A definir'}
                              </td>
                              <td className="px-3.5 py-3 text-slate-500 dark:text-slate-400">
                                {os.dataAgendamento || os.dataAbertura || '-'}
                              </td>
                              <td className="px-3.5 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-white">
                                R$ {formatCurrency(os.valorTotal || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CARD 2: PRODUTOS COM ESTOQUE BAIXO */}
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Estoque Baixo
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Equipamentos próximos do nível mínimo.
                      </p>
                    </div>
                    <Link
                      to="/estoque"
                      className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <span>Ver estoque</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>

                  {produtosEstoqueBaixo.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl mt-3">
                      Estoque operando com níveis adequados.
                    </div>
                  ) : (
                    <div className="space-y-2.5 mt-3">
                      {produtosEstoqueBaixo.slice(0, 5).map(prod => (
                        <div
                          key={prod.id}
                          className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{prod.nome}</p>
                            <p className="text-[11px] text-slate-500">{prod.categoria || 'Geral'}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-red-600">
                              {prod.quantidade} {prod.unidade || 'un'}
                            </span>
                            <p className="text-[10px] text-slate-400">Mín: {prod.estoqueMinimo || 5}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/compras"
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors mt-3"
                >
                  Criar Pedido de Compra / Reposição
                </Link>
              </div>
            </div>

            {/* =========================================================================
                6. SITUAÇÃO FINANCEIRA (CONTAS A RECEBER E PAGAR)
            ========================================================================== */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-500" />
                    Situação Financeira Consolidada
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Posição de vencimentos, pendências e valores liquidados.
                  </p>
                </div>
                <Link
                  to="/financeiro"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Abrir módulo financeiro completo</span>
                  <ExternalLink size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLOCO: CONTAS A RECEBER */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Contas a Receber
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      Total: R$ {formatCurrency(metricas.receberPendentes + metricas.receberPagas)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50">
                      <p className="text-[10px] text-red-500 font-semibold uppercase">Vencidas</p>
                      <p className="text-sm font-bold text-red-600 mt-0.5">
                        R$ {formatCurrency(metricas.receberVencidas)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      <p className="text-[10px] text-amber-600 font-semibold uppercase">A Vencer</p>
                      <p className="text-sm font-bold text-amber-600 mt-0.5">
                        R$ {formatCurrency(metricas.receberPendentes - metricas.receberVencidas)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase">Recebidas</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">
                        R$ {formatCurrency(metricas.receberPagas)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BLOCO: CONTAS A PAGAR */}
                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
                      Contas a Pagar
                    </span>
                    <span className="text-xs font-bold text-red-600">
                      Total: R$ {formatCurrency(metricas.pagarPendentes + metricas.pagarPagas)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50">
                      <p className="text-[10px] text-red-500 font-semibold uppercase">Vencidas</p>
                      <p className="text-sm font-bold text-red-600 mt-0.5">
                        R$ {formatCurrency(metricas.pagarVencidas)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50">
                      <p className="text-[10px] text-amber-600 font-semibold uppercase">A Vencer</p>
                      <p className="text-sm font-bold text-amber-600 mt-0.5">
                        R$ {formatCurrency(metricas.pagarPendentes - metricas.pagarVencidas)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase">Pagas</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">
                        R$ {formatCurrency(metricas.pagarPagas)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
