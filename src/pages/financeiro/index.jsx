import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowRight,
  ExternalLink,
  Check,
  RotateCcw,
  Wallet,
  Receipt,
  CreditCard,
  User,
  Boxes,
  Package
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { useFinanceiro } from '../../hooks/useFinanceiro';
import { useVendas } from '../../hooks/useVendas';
import { useCompras } from '../../hooks/useCompras';
import { useOrdensServico } from '../../hooks/useOrdensServico';
import { useEstoque } from '../../hooks/useEstoque';
import { formatCurrency, formatarData, formatReal } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';

// Paleta Zeu-Tech refinada para gráficos
const PALETA_CORES = [
  '#00c8ff', // Ciano Zeu-Tech
  '#3b82f6', // Azul Royal
  '#10b981', // Verde Esmeralda
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo / Violeta
  '#06b6d4', // Teal
  '#ec4899', // Rosa
  '#64748b'  // Slate
];

// Parser auxiliar robusto para datas no Firebase
function parseData(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val?.toDate === 'function') {
    const d = val.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (val?.seconds) {
    const d = new Date(val.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export default function FinanceiroPage() {
  // Hooks reais do sistema
  const {
    contasReceber = [],
    contasPagar = [],
    fluxoCaixa = [],
    loading: loadingFinanceiro,
    listarContasReceber,
    listarContasPagar,
    listarFluxoCaixa,
    receberConta,
    pagarConta,
    adicionarContaReceber,
    adicionarContaPagar
  } = useFinanceiro();

  const { vendas = [], loading: loadingVendas, listarVendas } = useVendas();
  const { compras = [], loading: loadingCompras, listarCompras } = useCompras();
  const { ordensServico = [], listarOrdensServico } = useOrdensServico();
  const { produtos = [], loading: loadingEstoque, listarProdutos } = useEstoque();

  // Estados de busca e filtro da tabela de patrimônio em estoque
  const [buscaEstoque, setBuscaEstoque] = useState('');
  const [filtroEstoqueFinanceiro, setFiltroEstoqueFinanceiro] = useState('com_estoque');

  // Estados dos Filtros
  const [periodo, setPeriodo] = useState('todos'); // 'hoje', '7dias', '30dias', 'mes', 'mes_anterior', 'ano', 'todos', 'personalizado'
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos', 'receitas', 'despesas', 'contas_receber', 'contas_pagar'
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');

  // Modais e Controles de Ação
  const [modalAberto, setModalAberto] = useState(null); // 'recebido', 'aReceber', 'despesas', 'saldo', 'novaContaPagar', 'novaContaReceber', 'baixaConta', 'todasReceber', 'patrimonioEstoque'
  const [itemBaixa, setItemBaixa] = useState(null); // { conta, tipo: 'receber' | 'pagar' }
  const [abaMovimentacoes, setAbaMovimentacoes] = useState('receitas'); // 'receitas' | 'despesas'

  // Formulário Nova Conta a Pagar
  const [formPagar, setFormPagar] = useState({
    fornecedor: '',
    descricao: '',
    categoria: 'Fornecedores',
    valor: '',
    dataVencimento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Formulário Nova Conta a Receber
  const [formReceber, setFormReceber] = useState({
    clienteNome: '',
    descricao: '',
    categoria: 'Vendas/Serviços',
    valor: '',
    dataVencimento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Formulário Baixa de Conta
  const [formBaixa, setFormBaixa] = useState({
    valor: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    formaPagamento: 'PIX',
    observacoes: ''
  });

  // Carregamento inicial de todas as fontes de dados financeiras
  useEffect(() => {
    listarVendas();
    listarCompras();
    listarContasReceber();
    listarContasPagar();
    listarFluxoCaixa();
    listarProdutos();
    if (typeof listarOrdensServico === 'function') {
      listarOrdensServico();
    }
  }, []);

  // Calcular limites de data de acordo com o filtro selecionado
  const intervaloDatas = useMemo(() => {
    const hoje = new Date();
    let inicio = new Date();
    let fim = new Date(hoje);
    fim.setHours(23, 59, 59, 999);

    switch (periodo) {
      case 'hoje':
        inicio.setHours(0, 0, 0, 0);
        break;
      case '7dias':
        inicio.setDate(hoje.getDate() - 7);
        inicio.setHours(0, 0, 0, 0);
        break;
      case '30dias':
        inicio.setDate(hoje.getDate() - 30);
        inicio.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'mes_anterior':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 0, 0, 0, 0);
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'todos':
        inicio = new Date(2000, 0, 1, 0, 0, 0, 0);
        break;
      case 'personalizado':
        if (dataInicio) {
          const parts = dataInicio.split('-');
          inicio = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
        } else {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
        }
        if (dataFim) {
          const parts = dataFim.split('-');
          fim = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
        }
        break;
      default:
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
    }

    return { inicio, fim };
  }, [periodo, dataInicio, dataFim]);

  // Lista de Categorias Reais existentes no sistema
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set();
    contasPagar.forEach(c => {
      if (c.categoria && c.categoria.trim()) cats.add(c.categoria.trim());
    });
    compras.forEach(c => {
      if (c.categoria && c.categoria.trim()) cats.add(c.categoria.trim());
    });
    contasReceber.forEach(c => {
      if (c.categoria && c.categoria.trim()) cats.add(c.categoria.trim());
    });
    fluxoCaixa.forEach(f => {
      if (f.categoria && f.categoria.trim()) cats.add(f.categoria.trim());
    });
    return Array.from(cats).sort();
  }, [contasPagar, compras, contasReceber, fluxoCaixa]);

  // Filtragem e normalização das entidades financeiras
  const dadosFiltrados = useMemo(() => {
    const { inicio, fim } = intervaloDatas;
    const busca = termoBusca.trim().toLowerCase();

    // 1. Vendas
    const vendasFiltradas = vendas.filter(v => {
      const dt = parseData(v.dataVenda || v.criadoEm);
      if (!dt || dt < inicio || dt > fim) return false;
      if (busca && !v.clienteNome?.toLowerCase().includes(busca) && !v.codigoVenda?.toLowerCase().includes(busca)) return false;
      return true;
    });

    // 2. Compras
    const comprasFiltradas = compras.filter(c => {
      const dt = parseData(c.dataCompra || c.criadoEm);
      if (!dt || dt < inicio || dt > fim) return false;
      if (categoriaFiltro !== 'todas' && c.categoria !== categoriaFiltro) return false;
      if (busca && !c.fornecedor?.toLowerCase().includes(busca) && !c.codigoCompra?.toLowerCase().includes(busca)) return false;
      return true;
    });

    // 3. Contas a Receber
    const contasReceberFiltradas = contasReceber.filter(c => {
      const dtRef = parseData(c.dataVencimento || c.criadoEm);
      if (!dtRef || dtRef < inicio || dtRef > fim) return false;
      if (categoriaFiltro !== 'todas' && c.categoria !== categoriaFiltro) return false;
      if (busca && !c.clienteNome?.toLowerCase().includes(busca) && !c.descricao?.toLowerCase().includes(busca)) return false;
      return true;
    });

    // 4. Contas a Pagar
    const contasPagarFiltradas = contasPagar.filter(cp => {
      const dtRef = parseData(cp.dataVencimento || cp.criadoEm);
      if (!dtRef || dtRef < inicio || dtRef > fim) return false;
      if (categoriaFiltro !== 'todas' && cp.categoria !== categoriaFiltro) return false;
      if (busca && !cp.fornecedor?.toLowerCase().includes(busca) && !cp.descricao?.toLowerCase().includes(busca)) return false;
      return true;
    });

    // 5. Fluxo de Caixa Manual / Lançamentos
    const fluxoFiltrado = fluxoCaixa.filter(f => {
      const dt = parseData(f.criadoEm || f.data);
      if (!dt || dt < inicio || dt > fim) return false;
      if (categoriaFiltro !== 'todas' && f.categoria !== categoriaFiltro) return false;
      if (busca && !f.descricao?.toLowerCase().includes(busca)) return false;
      return true;
    });

    return {
      vendas: vendasFiltradas,
      compras: comprasFiltradas,
      contasReceber: contasReceberFiltradas,
      contasPagar: contasPagarFiltradas,
      fluxoCaixa: fluxoFiltrado
    };
  }, [vendas, compras, contasReceber, contasPagar, fluxoCaixa, intervaloDatas, categoriaFiltro, termoBusca]);

  // Estatísticas e Indicadores Consolidados
  const estatisticas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Contas a Receber (do período filtrado)
    const contasAReceberPendentes = dadosFiltrados.contasReceber.filter(
      c => c.status === 'pendente' || c.status === 'atrasado' || c.status === 'em_aberto' || !c.status
    );
    const contasAReceberPagas = dadosFiltrados.contasReceber.filter(
      c => c.status === 'pago' || c.status === 'recebida' || c.status === 'liquidada'
    );

    // Vendas fiado/em andamento
    const vendasFiado = dadosFiltrados.vendas.filter(v => v.status === 'em_andamento');
    const vendasPagas = dadosFiltrados.vendas.filter(v => v.status === 'concluida');

    // Total a Receber (Previsto)
    let totalAReceber = contasAReceberPendentes.reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);
    // Adicionar vendas fiado que não possuem duplicidade com contasReceber
    const totalVendasFiado = vendasFiado.reduce((acc, v) => acc + (parseFloat(v.valorTotal) || 0), 0);
    totalAReceber += totalVendasFiado;

    // Vencidas (Receber)
    let receberVencidas = 0;
    let qtdReceberVencidas = 0;

    contasAReceberPendentes.forEach(c => {
      const dtVenc = parseData(c.dataVencimento);
      const val = parseFloat(c.valor) || 0;
      if (dtVenc && dtVenc < hoje) {
        receberVencidas += val;
        qtdReceberVencidas += 1;
      }
    });

    // Contas a Pagar (do período filtrado)
    const contasPagarPendentes = dadosFiltrados.contasPagar.filter(
      cp => cp.status === 'pendente' || cp.status === 'atrasado' || cp.status === 'aberta' || !cp.status
    );
    const contasPagarPagas = dadosFiltrados.contasPagar.filter(
      cp => cp.status === 'paga' || cp.status === 'liquidada'
    );

    // Total a Pagar
    const totalAPagar = contasPagarPendentes.reduce((acc, cp) => acc + (parseFloat(cp.valor) || 0), 0);

    // Vencidas (Pagar)
    let pagarVencidas = 0;
    let qtdPagarVencidas = 0;

    contasPagarPendentes.forEach(cp => {
      const dtVenc = parseData(cp.dataVencimento);
      const val = parseFloat(cp.valor) || 0;
      if (dtVenc && dtVenc < hoje) {
        pagarVencidas += val;
        qtdPagarVencidas += 1;
      }
    });

    // Total Receitas Realizadas (Entradas no período)
    const totalVendasConcluidas = vendasPagas.reduce((acc, v) => acc + (parseFloat(v.valorTotal) || 0), 0);
    const totalParcelasRecebidas = contasAReceberPagas.reduce((acc, c) => acc + (parseFloat(c.valorRecebido || c.valor) || 0), 0);
    const totalEntradasCaixa = dadosFiltrados.fluxoCaixa
      .filter(f => f.tipo === 'entrada' && !f.vendaRef && !f.contaReceberRef)
      .reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0);

    const totalReceitas = totalVendasConcluidas + totalParcelasRecebidas + totalEntradasCaixa;

    // Total Despesas Realizadas (Saídas no período)
    const totalComprasEstoque = dadosFiltrados.compras.reduce((acc, c) => acc + (parseFloat(c.valorTotal) || 0), 0);
    const totalContasPagarQuitadas = contasPagarPagas.reduce((acc, cp) => acc + (parseFloat(cp.valorPago || cp.valor) || 0), 0);
    const totalSaidasCaixa = dadosFiltrados.fluxoCaixa
      .filter(f => f.tipo === 'saida' && !f.compraRef && !f.contaPagarRef)
      .reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0);

    const totalDespesas = totalComprasEstoque + totalContasPagarQuitadas + totalSaidasCaixa;

    // Saldo Líquido do Período
    const saldo = totalReceitas - totalDespesas;

    return {
      totalAReceber,
      receberVencidas,
      qtdReceberVencidas,
      totalAPagar,
      pagarVencidas,
      qtdPagarVencidas,
      totalReceitas,
      totalDespesas,
      saldo,
      totalVendasConcluidas,
      totalParcelasRecebidas,
      totalComprasEstoque,
      totalContasPagarQuitadas,
      qtdVendasPagas: vendasPagas.length,
      qtdVendasFiado: vendasFiado.length,
      qtdParcelasPagas: contasAReceberPagas.length,
      qtdParcelasPendentes: contasAReceberPendentes.length,
      qtdCompras: dadosFiltrados.compras.length,
      qtdContasPagarPendentes: contasPagarPendentes.length,
      qtdContasPagarPagas: contasPagarPagas.length
    };
  }, [dadosFiltrados]);

  // Indicadores de Patrimônio em Estoque Físico (Itens em casa / depósito)
  const metricasEstoque = useMemo(() => {
    let valorCustoTotal = 0;
    let valorVendaTotal = 0;
    let totalUnidades = 0;
    let produtosComEstoque = 0;
    let produtosZerados = 0;

    produtos.forEach(p => {
      const qtd = parseFloat(p.quantidade) || 0;
      const cUnit = parseFloat(p.precoCompra ?? p.valorCompra ?? p.valorCusto) || 0;
      const vUnit = parseFloat(p.precoVenda ?? p.valorVenda) || 0;

      if (qtd > 0) {
        produtosComEstoque++;
        totalUnidades += qtd;
        valorCustoTotal += qtd * cUnit;
        valorVendaTotal += qtd * vUnit;
      } else {
        produtosZerados++;
      }
    });

    const lucroPotencial = valorVendaTotal - valorCustoTotal;
    const margemPotencial = valorVendaTotal > 0 ? ((lucroPotencial / valorVendaTotal) * 100).toFixed(1) : 0;

    return {
      valorCustoTotal,
      valorVendaTotal,
      lucroPotencial,
      margemPotencial,
      totalUnidades,
      produtosComEstoque,
      produtosZerados,
      totalCadastrados: produtos.length
    };
  }, [produtos]);

  // Lista filtrada e ordenada de produtos para a tabela detalhada do Financeiro
  const produtosEstoqueFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const termo = buscaEstoque.trim().toLowerCase();
      const matchBusca = !termo ||
        p.nome?.toLowerCase().includes(termo) ||
        p.categoria?.toLowerCase().includes(termo) ||
        p.marca?.toLowerCase().includes(termo) ||
        p.modelo?.toLowerCase().includes(termo) ||
        p.codigo?.toLowerCase().includes(termo);

      const qtd = parseFloat(p.quantidade) || 0;
      let matchFiltro = true;
      if (filtroEstoqueFinanceiro === 'com_estoque') {
        matchFiltro = qtd > 0;
      } else if (filtroEstoqueFinanceiro === 'zerados') {
        matchFiltro = qtd === 0;
      }

      return matchBusca && matchFiltro;
    }).sort((a, b) => {
      const cUnitA = parseFloat(a.precoCompra ?? a.valorCompra ?? a.valorCusto) || 0;
      const cUnitB = parseFloat(b.precoCompra ?? b.valorCompra ?? b.valorCusto) || 0;
      const totalA = (parseFloat(a.quantidade) || 0) * cUnitA;
      const totalB = (parseFloat(b.quantidade) || 0) * cUnitB;
      return totalB - totalA;
    });
  }, [produtos, buscaEstoque, filtroEstoqueFinanceiro]);

  // 1. Dados do Gráfico de Fluxo de Caixa (Temporal)
  const dadosGraficoFluxo = useMemo(() => {
    const mapaDias = new Map();

    const registrar = (dataObj, entradas = 0, saidas = 0) => {
      if (!dataObj) return;
      const chave = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!mapaDias.has(chave)) {
        mapaDias.set(chave, {
          data: chave,
          timestamp: dataObj.getTime(),
          entradas: 0,
          saidas: 0,
          saldo: 0
        });
      }
      const entry = mapaDias.get(chave);
      entry.entradas += entradas;
      entry.saidas += saidas;
      entry.saldo = entry.entradas - entry.saidas;
    };

    // Vendas pagas
    dadosFiltrados.vendas.filter(v => v.status === 'concluida').forEach(v => {
      const dt = parseData(v.dataVenda || v.criadoEm);
      registrar(dt, parseFloat(v.valorTotal) || 0, 0);
    });

    // Contas receber pagas
    dadosFiltrados.contasReceber.filter(c => c.status === 'pago' || c.status === 'recebida').forEach(c => {
      const dt = parseData(c.dataPagamento || c.dataVencimento || c.criadoEm);
      registrar(dt, parseFloat(c.valorRecebido || c.valor) || 0, 0);
    });

    // Compras estoque
    dadosFiltrados.compras.forEach(c => {
      const dt = parseData(c.dataCompra || c.criadoEm);
      registrar(dt, 0, parseFloat(c.valorTotal) || 0);
    });

    // Contas pagar pagas
    dadosFiltrados.contasPagar.filter(cp => cp.status === 'paga').forEach(cp => {
      const dt = parseData(cp.dataPagamento || cp.dataVencimento || cp.criadoEm);
      registrar(dt, 0, parseFloat(cp.valorPago || cp.valor) || 0);
    });

    // Fluxo de caixa direto
    dadosFiltrados.fluxoCaixa.forEach(f => {
      const dt = parseData(f.criadoEm || f.data);
      if (f.tipo === 'entrada' && !f.vendaRef && !f.contaReceberRef) {
        registrar(dt, parseFloat(f.valor) || 0, 0);
      } else if (f.tipo === 'saida' && !f.compraRef && !f.contaPagarRef) {
        registrar(dt, 0, parseFloat(f.valor) || 0);
      }
    });

    let lista = Array.from(mapaDias.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Salvaguarda: Recharts AreaChart necessita de ao menos 2 pontos para traçar a área/linha contínua
    if (lista.length === 1) {
      const p = lista[0];
      const dataOriginal = new Date(p.timestamp || Date.now());

      const anterior = new Date(dataOriginal);
      anterior.setDate(anterior.getDate() - 1);
      const chaveAnt = anterior.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const posterior = new Date(dataOriginal);
      posterior.setDate(posterior.getDate() + 1);
      const chavePos = posterior.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      lista = [
        { data: chaveAnt, timestamp: anterior.getTime(), entradas: 0, saidas: 0, saldo: 0 },
        p,
        { data: chavePos, timestamp: posterior.getTime(), entradas: 0, saidas: 0, saldo: 0 }
      ];
    } else if (lista.length === 0) {
      const hoje = new Date();
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const ontemStr = ontem.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const hojeStr = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      return [
        { data: ontemStr, timestamp: ontem.getTime(), entradas: 0, saidas: 0, saldo: 0 },
        { data: hojeStr, timestamp: hoje.getTime(), entradas: 0, saidas: 0, saldo: 0 }
      ];
    }

    return lista;
  }, [dadosFiltrados]);

  // 2. Gráfico de Rosca: Despesas por Categoria Real
  const dadosDespesasPorCategoria = useMemo(() => {
    const mapaCat = new Map();

    // Compras de estoque
    dadosFiltrados.compras.forEach(c => {
      const cat = c.categoria || 'Compras de Estoque';
      const val = parseFloat(c.valorTotal) || 0;
      mapaCat.set(cat, (mapaCat.get(cat) || 0) + val);
    });

    // Contas a pagar (pagas ou pendentes do período)
    dadosFiltrados.contasPagar.forEach(cp => {
      const cat = cp.categoria || 'Despesas Gerais';
      const val = parseFloat(cp.valor) || 0;
      mapaCat.set(cat, (mapaCat.get(cat) || 0) + val);
    });

    // Saídas de fluxo de caixa
    dadosFiltrados.fluxoCaixa.filter(f => f.tipo === 'saida').forEach(f => {
      const cat = f.categoria || 'Outras Saídas';
      const val = parseFloat(f.valor) || 0;
      mapaCat.set(cat, (mapaCat.get(cat) || 0) + val);
    });

    const totalDesp = Array.from(mapaCat.values()).reduce((a, b) => a + b, 0);

    const categoriasArray = Array.from(mapaCat.entries())
      .map(([nome, valor]) => ({
        name: nome,
        value: valor,
        percent: totalDesp > 0 ? (valor / totalDesp) * 100 : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      itens: categoriasArray,
      totalGeral: totalDesp
    };
  }, [dadosFiltrados]);


  // 4. Lista consolidada de Contas a Receber
  const listaContasReceber = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return [...dadosFiltrados.contasReceber].map(c => {
      const dtVenc = parseData(c.dataVencimento);
      let statusCalculado = c.status || 'pendente';

      if (statusCalculado !== 'pago' && statusCalculado !== 'recebida') {
        if (dtVenc && dtVenc < hoje) {
          statusCalculado = 'vencida';
        } else {
          statusCalculado = 'pendente';
        }
      }

      return {
        ...c,
        statusCalculado,
        dataVencimentoObj: dtVenc
      };
    }).sort((a, b) => {
      if (!a.dataVencimentoObj) return 1;
      if (!b.dataVencimentoObj) return -1;
      return a.dataVencimentoObj.getTime() - b.dataVencimentoObj.getTime();
    });
  }, [dadosFiltrados.contasReceber]);


  // 6. Últimas Receitas e Despesas (Movimentações)
  const ultimasReceitas = useMemo(() => {
    const itens = [];

    // Vendas
    dadosFiltrados.vendas.forEach(v => {
      itens.push({
        id: `venda-${v.id}`,
        tipo: 'venda',
        origem: 'Venda de Balcão / Pedido',
        clienteFornecedor: v.clienteNome || 'Cliente Consumidor',
        descricao: v.codigoVenda ? `Venda #${v.codigoVenda}` : 'Venda realizada',
        valor: parseFloat(v.valorTotal) || 0,
        data: parseData(v.dataVenda || v.criadoEm),
        status: v.status === 'concluida' ? 'pago' : 'pendente'
      });
    });

    // Contas a Receber
    dadosFiltrados.contasReceber.forEach(c => {
      itens.push({
        id: `cr-${c.id}`,
        tipo: 'recebimento',
        origem: 'Conta a Receber',
        clienteFornecedor: c.clienteNome || 'Cliente',
        descricao: c.descricao || 'Recebimento de Parcela',
        valor: parseFloat(c.valor) || 0,
        data: parseData(c.dataPagamento || c.dataVencimento || c.criadoEm),
        status: c.status === 'pago' ? 'pago' : 'pendente'
      });
    });

    return itens
      .filter(item => item.data)
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [dadosFiltrados.vendas, dadosFiltrados.contasReceber]);

  const ultimasDespesas = useMemo(() => {
    const itens = [];

    // Compras
    dadosFiltrados.compras.forEach(c => {
      itens.push({
        id: `compra-${c.id}`,
        tipo: 'compra',
        origem: 'Compra de Fornecedor / Estoque',
        clienteFornecedor: c.fornecedor || 'Fornecedor',
        descricao: c.codigoCompra ? `Compra #${c.codigoCompra}` : 'Compra de Estoque',
        valor: parseFloat(c.valorTotal) || 0,
        data: parseData(c.dataCompra || c.criadoEm),
        status: 'pago'
      });
    });

    // Contas a Pagar
    dadosFiltrados.contasPagar.forEach(cp => {
      itens.push({
        id: `cp-${cp.id}`,
        tipo: 'pagamento',
        origem: cp.categoria || 'Despesa Operacional',
        clienteFornecedor: cp.fornecedor || 'Fornecedor / Beneficiário',
        descricao: cp.descricao || 'Pagamento de Conta',
        valor: parseFloat(cp.valor) || 0,
        data: parseData(cp.dataPagamento || cp.dataVencimento || cp.criadoEm),
        status: cp.status === 'paga' ? 'pago' : 'pendente'
      });
    });

    return itens
      .filter(item => item.data)
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [dadosFiltrados.compras, dadosFiltrados.contasPagar]);

  // Handlers para Ações e Modais
  const handleLimparFiltros = () => {
    setPeriodo('todos');
    setDataInicio('');
    setDataFim('');
    setTipoFiltro('todos');
    setCategoriaFiltro('todas');
    setTermoBusca('');
  };

  const handleSalvarContaPagar = async (e) => {
    e.preventDefault();
    if (!formPagar.fornecedor || !formPagar.valor || !formPagar.dataVencimento) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    try {
      await adicionarContaPagar({
        fornecedor: formPagar.fornecedor,
        descricao: formPagar.descricao || formPagar.categoria,
        categoria: formPagar.categoria,
        valor: parseFloat(formPagar.valor),
        dataVencimento: new Date(`${formPagar.dataVencimento}T12:00:00`),
        observacoes: formPagar.observacoes
      });
      alert('Conta a pagar cadastrada com sucesso!');
      setModalAberto(null);
      setFormPagar({
        fornecedor: '',
        descricao: '',
        categoria: 'Fornecedores',
        valor: '',
        dataVencimento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      listarContasPagar();
    } catch (err) {
      alert(`Erro ao cadastrar conta a pagar: ${err.message}`);
    }
  };

  const handleSalvarContaReceber = async (e) => {
    e.preventDefault();
    if (!formReceber.clienteNome || !formReceber.valor || !formReceber.dataVencimento) {
      alert('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }
    try {
      await adicionarContaReceber({
        clienteNome: formReceber.clienteNome,
        descricao: formReceber.descricao || 'Recebimento avulso',
        categoria: formReceber.categoria,
        valor: parseFloat(formReceber.valor),
        dataVencimento: new Date(`${formReceber.dataVencimento}T12:00:00`),
        observacoes: formReceber.observacoes
      });
      alert('Conta a receber cadastrada com sucesso!');
      setModalAberto(null);
      setFormReceber({
        clienteNome: '',
        descricao: '',
        categoria: 'Vendas/Serviços',
        valor: '',
        dataVencimento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      listarContasReceber();
    } catch (err) {
      alert(`Erro ao cadastrar conta a receber: ${err.message}`);
    }
  };

  const abrirBaixa = (conta, tipo) => {
    setItemBaixa({ conta, tipo });
    setFormBaixa({
      valor: conta.valor || '',
      dataPagamento: new Date().toISOString().split('T')[0],
      formaPagamento: 'PIX',
      observacoes: ''
    });
    setModalAberto('baixaConta');
  };

  const handleConfirmarBaixa = async (e) => {
    e.preventDefault();
    if (!itemBaixa) return;
    try {
      const valorNumerico = parseFloat(formBaixa.valor) || itemBaixa.conta.valor;
      const dataPagamento = new Date(`${formBaixa.dataPagamento}T12:00:00`);

      if (itemBaixa.tipo === 'pagar') {
        await pagarConta(itemBaixa.conta.id, {
          valorPago: valorNumerico,
          valorTotal: itemBaixa.conta.valor,
          dataPagamento,
          formaPagamento: formBaixa.formaPagamento,
          observacoes: formBaixa.observacoes,
          descricao: itemBaixa.conta.descricao || itemBaixa.conta.fornecedor,
          categoria: itemBaixa.conta.categoria || 'despesa'
        });
        alert('Pagamento registrado com sucesso!');
        listarContasPagar();
        listarFluxoCaixa();
      } else {
        await receberConta(itemBaixa.conta.id, {
          status: 'pago',
          valorRecebido: valorNumerico,
          dataPagamento,
          formaPagamento: formBaixa.formaPagamento,
          observacoes: formBaixa.observacoes
        });
        alert('Recebimento registrado com sucesso!');
        listarContasReceber();
      }
      setModalAberto(null);
      setItemBaixa(null);
    } catch (err) {
      alert(`Erro ao registrar baixa: ${err.message}`);
    }
  };

  // Helper para texto do período
  const textoPeriodo = useMemo(() => {
    switch (periodo) {
      case 'hoje': return 'Hoje';
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'mes': return 'Este mês';
      case 'mes_anterior': return 'Mês anterior';
      case 'ano': return 'Este ano';
      case 'todos': return 'Todo o histórico';
      case 'personalizado':
        return dataInicio && dataFim
          ? `${formatarData(dataInicio)} até ${formatarData(dataFim)}`
          : 'Personalizado';
      default: return 'Este mês';
    }
  }, [periodo, dataInicio, dataFim]);

  const loading = loadingFinanceiro || loadingVendas || loadingCompras;

  return (
    <PageLayout title="Financeiro">
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO DO PAINEL FINANCEIRO */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <Wallet size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Financeiro
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Acompanhe suas receitas, despesas e tenha total controle do seu fluxo de caixa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Botão Novo Pagamento / Nova Despesa */}
              <button
                onClick={() => setModalAberto('novaContaPagar')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 rounded-xl text-sm font-semibold transition-all border border-rose-200 dark:border-rose-800/60 shadow-sm"
              >
                <Plus size={16} />
                Nova Despesa
              </button>

              {/* Botão Novo Recebimento */}
              <button
                onClick={() => setModalAberto('novaContaReceber')}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-sm font-semibold transition-all border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
              >
                <Plus size={16} />
                Nova Receita
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILTROS AVANÇADOS */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-all">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <Filter size={18} className="text-cyan-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Filtros de Análise Financeira
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="hoje">Hoje</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="30dias">Últimos 30 dias</option>
                <option value="mes">Este mês</option>
                <option value="mes_anterior">Mês anterior</option>
                <option value="ano">Este ano</option>
                <option value="todos">Todos os registros</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="todos">Todos</option>
                <option value="receitas">Receitas</option>
                <option value="despesas">Despesas</option>
                <option value="contas_receber">Contas a receber</option>
                <option value="contas_pagar">Contas a pagar</option>
              </select>
            </div>

            {/* Categoria Real */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria
              </label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="todas">Todas as categorias</option>
                {categoriasDisponiveis.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente / Fornecedor Pesquisa */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cliente / Fornecedor
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou código..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Período Personalizado: Inputs de Data */}
          {periodo === 'personalizado' && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Botões de Ação dos Filtros */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Exibindo dados para: <strong className="text-cyan-600 dark:text-cyan-400">{textoPeriodo}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLimparFiltros}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <RotateCcw size={14} />
                Limpar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12">
            <LoadingSpinner text="Consolidando dados financeiros..." />
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 3. CARDS PRINCIPAIS DE INDICADORES (5 CARDS) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* CARD 1: Total a Receber */}
              <div
                onClick={() => setModalAberto('aReceber')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total a Receber
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Calendar size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  R$ {formatCurrency(estatisticas.totalAReceber)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {estatisticas.qtdParcelasPendentes} parcela(s) pendente(s)
                  </span>
                  {estatisticas.qtdReceberVencidas > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      {estatisticas.qtdReceberVencidas} em atraso
                    </span>
                  )}
                </div>
              </div>

              {/* CARD 2: Valor em Estoque (Patrimônio Físico em Casa/Depósito) */}
              <div
                onClick={() => setModalAberto('patrimonioEstoque')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Valor em Estoque
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                      Custo
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                    <Boxes size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  R$ {formatCurrency(metricasEstoque.valorCustoTotal)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate pr-1">
                    Venda: R$ {formatCurrency(metricasEstoque.valorVendaTotal)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-400 whitespace-nowrap">
                    {metricasEstoque.totalUnidades} un • {metricasEstoque.produtosComEstoque} itens
                  </span>
                </div>
              </div>

              {/* CARD 3: Saldo do Período */}
              <div
                onClick={() => setModalAberto('saldo')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Saldo do Período
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                    estatisticas.saldo >= 0
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                      : 'bg-orange-50 dark:bg-orange-950/40 brand-text'
                  }`}>
                    <DollarSign size={20} />
                  </div>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${
                  estatisticas.saldo >= 0
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'brand-text'
                }`}>
                  R$ {formatCurrency(Math.abs(estatisticas.saldo))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${
                    estatisticas.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'brand-text'
                  }`}>
                    {estatisticas.saldo >= 0 ? 'Superavitário (+)' : 'Deficitário (-)'}
                  </span>
                  <span className="text-slate-400 dark:text-slate-400">
                    Entradas - Saídas
                  </span>
                </div>
              </div>

              {/* CARD 4: Receitas */}
              <div
                onClick={() => setModalAberto('recebido')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Receitas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  R$ {formatCurrency(estatisticas.totalReceitas)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-400">
                  <span>{estatisticas.qtdVendasPagas} venda(s)</span>
                  <span>{estatisticas.qtdParcelasPagas} parcela(s)</span>
                </div>
              </div>

              {/* CARD 5: Despesas */}
              <div
                onClick={() => setModalAberto('despesas')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Despesas
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <TrendingDown size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  R$ {formatCurrency(estatisticas.totalDespesas)}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-400">
                  <span>{estatisticas.qtdCompras} compra(s)</span>
                  <span>{estatisticas.qtdContasPagarPagas} conta(s)</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. FLUXO DE CAIXA & DESPESAS POR CATEGORIA (GRÁFICOS) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico 1: Fluxo de Caixa (2 colunas no desktop) */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart3 size={20} className="text-cyan-500" />
                      Fluxo de Caixa
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evolução de entradas, saídas e saldo líquido diário
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600 dark:text-slate-300">Entradas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600 dark:text-slate-300">Saídas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                      <span className="text-slate-600 dark:text-slate-300">Saldo</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                      data={dadosGraficoFluxo}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="corEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="corSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="corSaldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis
                        dataKey="data"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      />
                      <Tooltip
                        formatter={(valor) => [`R$ ${formatCurrency(valor)}`]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="entradas"
                        name="Entradas"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#corEntradas)"
                      />
                      <Area
                        type="monotone"
                        dataKey="saidas"
                        name="Saídas"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#corSaidas)"
                      />
                      <Area
                        type="monotone"
                        dataKey="saldo"
                        name="Saldo Líquido"
                        stroke="#00c8ff"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#corSaldo)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Despesas por Categoria (Rosca / Donut) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
                    <PieChartIcon size={20} className="text-cyan-500" />
                    Despesas por Categoria
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Distribuição percentual das saídas
                  </p>
                </div>

                <div className="h-52 w-full relative">
                  {dadosDespesasPorCategoria.itens.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={dadosDespesasPorCategoria.itens}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {dadosDespesasPorCategoria.itens.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PALETA_CORES[index % PALETA_CORES.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [`R$ ${formatCurrency(v)}`, 'Valor']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Nenhuma despesa no período
                    </div>
                  )}
                  {dadosDespesasPorCategoria.itens.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400">Total</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        R$ {formatCurrency(dadosDespesasPorCategoria.totalGeral)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Lista de Legendas de Categorias */}
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                  {dadosDespesasPorCategoria.itens.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PALETA_CORES[idx % PALETA_CORES.length] }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 font-medium text-slate-900 dark:text-slate-200">
                        R$ {formatCurrency(item.value)}{' '}
                        <span className="text-slate-400 dark:text-slate-400 font-normal">
                          ({item.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {dadosDespesasPorCategoria.itens.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-2">
                      Sem movimentações de despesa registradas.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 5. RESUMO DO FLUXO FINANCEIRO */}
            {/* ========================================================================= */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700/60 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Wallet size={20} className="text-cyan-500" />
                    Resumo Financeiro
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Visão consolidada do fluxo atual
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Situação do Fluxo de Caixa:
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    estatisticas.saldo >= 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {estatisticas.saldo >= 0 ? 'POSITIVO' : 'NEGATIVO'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Entradas */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Total de Entradas
                  </span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {formatCurrency(estatisticas.totalReceitas)}
                  </span>
                </div>

                {/* Saídas */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Total de Saídas
                  </span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    R$ {formatCurrency(estatisticas.totalDespesas)}
                  </span>
                </div>

                {/* Saldo */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Saldo do Período
                  </span>
                  <span className={`text-xl font-bold ${
                    estatisticas.saldo >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'brand-text'
                  }`}>
                    R$ {formatCurrency(Math.abs(estatisticas.saldo))}
                  </span>
                </div>
              </div>

              {/* Barra de Proporção Entradas vs Saídas */}
              <div className="pt-2">
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        estatisticas.totalReceitas + estatisticas.totalDespesas > 0
                          ? (estatisticas.totalReceitas / (estatisticas.totalReceitas + estatisticas.totalDespesas)) * 100
                          : 50
                      }%`
                    }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        estatisticas.totalReceitas + estatisticas.totalDespesas > 0
                          ? (estatisticas.totalDespesas / (estatisticas.totalReceitas + estatisticas.totalDespesas)) * 100
                          : 50
                      }%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                  <span>Receitas ({estatisticas.totalReceitas + estatisticas.totalDespesas > 0 ? Math.round((estatisticas.totalReceitas / (estatisticas.totalReceitas + estatisticas.totalDespesas)) * 100) : 50}%)</span>
                  <span>Despesas ({estatisticas.totalReceitas + estatisticas.totalDespesas > 0 ? Math.round((estatisticas.totalDespesas / (estatisticas.totalReceitas + estatisticas.totalDespesas)) * 100) : 50}%)</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. TABELA: CONTAS A RECEBER */}
            {/* ========================================================================= */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Contas a Receber
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Clientes e recebimentos do período
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalAberto('todasReceber')}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 group"
                >
                  Ver todas <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-2">Cliente</th>
                      <th className="py-2.5 px-2">Descrição</th>
                      <th className="py-2.5 px-2 text-right">Valor</th>
                      <th className="py-2.5 px-2 text-center">Vencimento</th>
                      <th className="py-2.5 px-2 text-center">Status</th>
                      <th className="py-2.5 px-2 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {listaContasReceber.slice(0, 6).map((c) => {
                      let statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
                      let labelStatus = 'Em aberto';

                      if (c.statusCalculado === 'pago' || c.status === 'pago') {
                        statusBadge = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
                        labelStatus = 'Paga';
                      } else if (c.statusCalculado === 'vencida') {
                        statusBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
                        labelStatus = 'Vencida';
                      } else {
                        labelStatus = 'Pendente';
                      }

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                            {c.clienteNome || 'Cliente'}
                          </td>
                          <td className="py-3 px-2 text-slate-500 dark:text-slate-400 max-w-[120px] truncate">
                            {c.descricao || 'Recebimento'}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-slate-800 dark:text-slate-100">
                            R$ {formatCurrency(c.valor)}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {c.dataVencimentoObj ? formatarData(c.dataVencimentoObj) : '-'}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge}`}>
                              {labelStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            {c.statusCalculado !== 'pago' && c.status !== 'pago' ? (
                              <button
                                onClick={() => abrirBaixa(c, 'receber')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-all"
                              >
                                Receber
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <Check size={12} /> Liquidada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {listaContasReceber.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                          Nenhuma conta a receber encontrada no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6.1 PATRIMÔNIO & ESTOQUE FÍSICO (ITENS EM CASA / ESTOQUE) */}
            {/* ========================================================================= */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl">
                    <Boxes size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Patrimônio & Estoque Físico
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                        Itens em Casa / Depósito
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Controle do capital investido em mercadorias disponíveis no estoque físico
                    </p>
                  </div>
                </div>

                {/* 4 Mini KPIs da Seção de Estoque */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Valor em Custo</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      R$ {formatCurrency(metricasEstoque.valorCustoTotal)}
                    </strong>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Valor em Venda</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      R$ {formatCurrency(metricasEstoque.valorVendaTotal)}
                    </strong>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lucro Projetado</span>
                    <strong className="text-cyan-600 dark:text-cyan-400 text-sm">
                      R$ {formatCurrency(metricasEstoque.lucroPotencial)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">({metricasEstoque.margemPotencial}%)</span>
                    </strong>
                  </div>
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Unidades Físicas</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">
                      {metricasEstoque.totalUnidades} un
                    </strong>
                  </div>
                </div>
              </div>

              {/* Barra de Filtros e Busca da Tabela de Estoque */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar produto por nome, marca, código..."
                    value={buscaEstoque}
                    onChange={(e) => setBuscaEstoque(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {buscaEstoque && (
                    <button onClick={() => setBuscaEstoque('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button
                      onClick={() => setFiltroEstoqueFinanceiro('com_estoque')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filtroEstoqueFinanceiro === 'com_estoque'
                          ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Em Estoque ({metricasEstoque.produtosComEstoque})
                    </button>
                    <button
                      onClick={() => setFiltroEstoqueFinanceiro('todos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filtroEstoqueFinanceiro === 'todos'
                          ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Todos ({metricasEstoque.totalCadastrados})
                    </button>
                    <button
                      onClick={() => setFiltroEstoqueFinanceiro('zerados')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        filtroEstoqueFinanceiro === 'zerados'
                          ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Zerados ({metricasEstoque.produtosZerados})
                    </button>
                  </div>

                  <a
                    href="/estoque"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
                  >
                    <span>Ir para Estoque</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>

              {/* Tabela dos Produtos em Estoque */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Produto</th>
                      <th className="py-2.5 px-3">Categoria</th>
                      <th className="py-2.5 px-3 text-center">Qtd em Estoque</th>
                      <th className="py-2.5 px-3 text-right">Custo Unitário</th>
                      <th className="py-2.5 px-3 text-right">Total Custo (Investido)</th>
                      <th className="py-2.5 px-3 text-right">Preço Venda Unit.</th>
                      <th className="py-2.5 px-3 text-right">Total Venda Projetado</th>
                      <th className="py-2.5 px-3 text-center">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {produtosEstoqueFiltrados.slice(0, 15).map((p) => {
                      const qtd = parseFloat(p.quantidade) || 0;
                      const cUnit = parseFloat(p.precoCompra ?? p.valorCompra ?? p.valorCusto) || 0;
                      const vUnit = parseFloat(p.precoVenda ?? p.valorVenda) || 0;
                      const totalCusto = qtd * cUnit;
                      const totalVenda = qtd * vUnit;
                      const margemUnit = vUnit > 0 && cUnit > 0
                        ? (((vUnit - cUnit) / vUnit) * 100).toFixed(0)
                        : 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {p.imagemBase64 ? (
                                <img src={p.imagemBase64} alt={p.nome} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                  <Package size={16} />
                                </div>
                              )}
                              <div className="max-w-[200px] truncate">
                                <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                                  {p.nome}
                                </span>
                                {(p.marca || p.modelo || p.codigo) && (
                                  <span className="text-[11px] text-slate-400 truncate block">
                                    {[p.marca, p.modelo, p.codigo ? `#${p.codigo}` : ''].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                              {p.categoria || 'Geral'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                              qtd > 0
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {qtd} {p.unidade || 'un'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            R$ {formatCurrency(cUnit)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            R$ {formatCurrency(totalCusto)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            R$ {formatCurrency(vUnit)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            R$ {formatCurrency(totalVenda)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {margemUnit > 0 ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {margemUnit}%
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {produtosEstoqueFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum produto encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {produtosEstoqueFiltrados.length > 15 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Exibindo os 15 produtos com maior valor em estoque (de {produtosEstoqueFiltrados.length} no total)</span>
                  <a href="/estoque" className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                    Ver todos no módulo de Estoque →
                  </a>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 7. VENDAS E COMPRAS RECENTES (ÚLTIMAS MOVIMENTAÇÕES INTEGRADAS) */}
            {/* ========================================================================= */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Receipt size={18} className="text-cyan-500" />
                    Últimas Movimentações Financeiras
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Histórico detalhado de vendas, compras e liquidações
                  </p>
                </div>

                {/* Abas Alternadoras: Receitas vs Despesas */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    onClick={() => setAbaMovimentacoes('receitas')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      abaMovimentacoes === 'receitas'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp size={14} />
                    Receitas ({ultimasReceitas.length})
                  </button>
                  <button
                    onClick={() => setAbaMovimentacoes('despesas')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      abaMovimentacoes === 'despesas'
                        ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <TrendingDown size={14} />
                    Despesas ({ultimasDespesas.length})
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {abaMovimentacoes === 'receitas' ? (
                  <>
                    {ultimasReceitas.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ShoppingCart size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {item.clienteFornecedor}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.origem} • {item.data ? formatarData(item.data) : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            + R$ {formatCurrency(item.valor)}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            item.status === 'pago'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}>
                            {item.status === 'pago' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {ultimasReceitas.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        Nenhuma receita registrada no período selecionado.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {ultimasDespesas.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {item.clienteFornecedor}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.origem} • {item.data ? formatarData(item.data) : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                            - R$ {formatCurrency(item.valor)}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Realizado
                          </span>
                        </div>
                      </div>
                    ))}
                    {ultimasDespesas.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        Nenhuma despesa registrada no período selecionado.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* MODAIS DE AÇÃO E DETALHAMENTO */}
        {/* ========================================================================= */}

        {/* 1. Modal Nova Conta a Pagar */}
        {modalAberto === 'novaContaPagar' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Plus size={18} className="text-rose-500" />
                    Nova Conta a Pagar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cadastre uma nova despesa ou compromisso financeiro</p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSalvarContaPagar} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fornecedor / Beneficiário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fornecedor de Peças XYZ, CPFL, Vivo"
                    value={formPagar.fornecedor}
                    onChange={(e) => setFormPagar({ ...formPagar, fornecedor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formPagar.valor}
                      onChange={(e) => setFormPagar({ ...formPagar, valor: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Vencimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={formPagar.dataVencimento}
                      onChange={(e) => setFormPagar({ ...formPagar, dataVencimento: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Fornecedores, Aluguel, Peças"
                      value={formPagar.categoria}
                      onChange={(e) => setFormPagar({ ...formPagar, categoria: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nota Fiscal 1234"
                      value={formPagar.descricao}
                      onChange={(e) => setFormPagar({ ...formPagar, descricao: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações adicionais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Informações de pagamento, código de barras, etc."
                    value={formPagar.observacoes}
                    onChange={(e) => setFormPagar({ ...formPagar, observacoes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalAberto(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Salvar Conta a Pagar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Modal Nova Conta a Receber */}
        {modalAberto === 'novaContaReceber' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Plus size={18} className="text-emerald-500" />
                    Nova Conta a Receber
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cadastre uma nova previsão de recebimento</p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSalvarContaReceber} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={formReceber.clienteNome}
                    onChange={(e) => setFormReceber({ ...formReceber, clienteNome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formReceber.valor}
                      onChange={(e) => setFormReceber({ ...formReceber, valor: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Vencimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={formReceber.dataVencimento}
                      onChange={(e) => setFormReceber({ ...formReceber, dataVencimento: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Serviços, Vendas, Contratos"
                      value={formReceber.categoria}
                      onChange={(e) => setFormReceber({ ...formReceber, categoria: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Parcela 2/3 - Manutenção"
                      value={formReceber.descricao}
                      onChange={(e) => setFormReceber({ ...formReceber, descricao: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações adicionais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes sobre a negociação..."
                    value={formReceber.observacoes}
                    onChange={(e) => setFormReceber({ ...formReceber, observacoes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalAberto(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Salvar Conta a Receber
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Modal Baixa de Conta (Receber ou Pagar) */}
        {modalAberto === 'baixaConta' && itemBaixa && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className={`p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between ${
                itemBaixa.tipo === 'pagar' ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'
              }`}>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 size={20} className={itemBaixa.tipo === 'pagar' ? 'text-rose-600' : 'text-emerald-600'} />
                    {itemBaixa.tipo === 'pagar' ? 'Liquidar Pagamento' : 'Confirmar Recebimento'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {itemBaixa.conta.fornecedor || itemBaixa.conta.clienteNome || 'Lançamento Financeiro'}
                  </p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmarBaixa} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Valor Original da Conta:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      R$ {formatCurrency(itemBaixa.conta.valor)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Vencimento:</span>
                    <span>{itemBaixa.conta.dataVencimento ? formatarData(itemBaixa.conta.dataVencimento) : '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Efetivo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formBaixa.valor}
                    onChange={(e) => setFormBaixa({ ...formBaixa, valor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data da Baixa *
                    </label>
                    <input
                      type="date"
                      required
                      value={formBaixa.dataPagamento}
                      onChange={(e) => setFormBaixa({ ...formBaixa, dataPagamento: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formBaixa.formaPagamento}
                      onChange={(e) => setFormBaixa({ ...formBaixa, formaPagamento: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="PIX">PIX</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência / TED">Transferência</option>
                      <option value="Boleto">Boleto Bancário</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Comentários / Comprovante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Pago via app Nubank, autenticação 84729"
                    value={formBaixa.observacoes}
                    onChange={(e) => setFormBaixa({ ...formBaixa, observacoes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setModalAberto(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-sm transition-all ${
                      itemBaixa.tipo === 'pagar'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    Confirmar Baixa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Modais de Detalhamento dos Cards (Total Recebido, A Receber, Despesas, Saldo) */}
        {modalAberto === 'recebido' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receitas Realizadas</h3>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    R$ {formatCurrency(estatisticas.totalReceitas)}
                  </p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Vendas Concluídas ({dadosFiltrados.vendas.filter(v => v.status === 'concluida').length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dadosFiltrados.vendas.filter(v => v.status === 'concluida').map(venda => (
                      <div key={venda.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{venda.clienteNome || 'Consumidor'}</p>
                          <p className="text-[11px] text-slate-400">
                            {venda.codigoVenda ? `#${venda.codigoVenda} • ` : ''}{venda.dataVenda ? formatarData(venda.dataVenda) : '-'}
                          </p>
                        </div>
                        <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          R$ {formatCurrency(venda.valorTotal)}
                        </p>
                      </div>
                    ))}
                    {dadosFiltrados.vendas.filter(v => v.status === 'concluida').length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma venda concluída no período.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Parcelas Recebidas ({dadosFiltrados.contasReceber.filter(c => c.status === 'pago').length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dadosFiltrados.contasReceber.filter(c => c.status === 'pago').map(conta => (
                      <div key={conta.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{conta.clienteNome || 'Cliente'}</p>
                          <p className="text-[11px] text-slate-400">{conta.descricao}</p>
                        </div>
                        <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          R$ {formatCurrency(conta.valorRecebido || conta.valor)}
                        </p>
                      </div>
                    ))}
                    {dadosFiltrados.contasReceber.filter(c => c.status === 'pago').length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma parcela quitada no período.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalAberto === 'aReceber' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Valores a Receber</h3>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    R$ {formatCurrency(estatisticas.totalAReceber)}
                  </p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Parcelas Pendentes ({estatisticas.qtdParcelasPendentes})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {dadosFiltrados.contasReceber.filter(c => c.status !== 'pago').map(conta => {
                      const dtVenc = parseData(conta.dataVencimento);
                      const isVencida = dtVenc && dtVenc < new Date();
                      return (
                        <div key={conta.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                          <div>
                            <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{conta.clienteNome || 'Cliente'}</p>
                            <p className="text-[11px] text-slate-400">
                              {conta.descricao} • Vencimento: {dtVenc ? formatarData(dtVenc) : '-'}
                              {isVencida && <span className="ml-2 text-rose-500 font-bold uppercase">Vencida</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                              R$ {formatCurrency(conta.valor)}
                            </span>
                            <button
                              onClick={() => {
                                setModalAberto(null);
                                abrirBaixa(conta, 'receber');
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold"
                            >
                              Receber
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {dadosFiltrados.contasReceber.filter(c => c.status !== 'pago').length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma parcela pendente encontrada.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Vendas Fiado / Em Andamento ({estatisticas.qtdVendasFiado})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dadosFiltrados.vendas.filter(v => v.status === 'em_andamento').map(venda => (
                      <div key={venda.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{venda.clienteNome || 'Consumidor'}</p>
                          <p className="text-[11px] text-slate-400">
                            {venda.codigoVenda ? `#${venda.codigoVenda} • ` : ''}{venda.dataVenda ? formatarData(venda.dataVenda) : '-'}
                          </p>
                        </div>
                        <p className="font-bold text-xs text-amber-600 dark:text-amber-400">
                          R$ {formatCurrency(venda.valorTotal)}
                        </p>
                      </div>
                    ))}
                    {dadosFiltrados.vendas.filter(v => v.status === 'em_andamento').length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma venda fiado no período.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhamento do Patrimônio em Estoque */}
        {modalAberto === 'patrimonioEstoque' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Boxes size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Patrimônio em Estoque Físico</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Produtos disponíveis em casa / depósito com valor de custo e venda
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block font-semibold uppercase">Total em Custo (Investido)</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                      R$ {formatCurrency(metricasEstoque.valorCustoTotal)}
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 block font-semibold uppercase">Total em Venda</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                      R$ {formatCurrency(metricasEstoque.valorVendaTotal)}
                    </span>
                  </div>
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800">
                    <span className="text-xs text-cyan-700 dark:text-cyan-300 block font-semibold uppercase">Lucro Projetado</span>
                    <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1 block">
                      R$ {formatCurrency(metricasEstoque.lucroPotencial)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Itens em Estoque ({metricasEstoque.produtosComEstoque} produtos • {metricasEstoque.totalUnidades} unidades)
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {produtos.filter(p => (parseFloat(p.quantidade) || 0) > 0).map(p => {
                      const qtd = parseFloat(p.quantidade) || 0;
                      const cUnit = parseFloat(p.precoCompra ?? p.valorCompra ?? p.valorCusto) || 0;
                      const vUnit = parseFloat(p.precoVenda ?? p.valorVenda) || 0;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{p.nome}</p>
                            <p className="text-[11px] text-slate-400">
                              {qtd} {p.unidade || 'un'} • Custo un: R$ {formatCurrency(cUnit)} • Venda un: R$ {formatCurrency(vUnit)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              Custo: R$ {formatCurrency(qtd * cUnit)}
                            </p>
                            <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                              Venda: R$ {formatCurrency(qtd * vUnit)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {metricasEstoque.produtosComEstoque === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">
                        Nenhum produto com quantidade em estoque físico no momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalAberto === 'totalAPagar' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Total a Pagar</h3>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    R$ {formatCurrency(estatisticas.totalAPagar)}
                  </p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dadosFiltrados.contasPagar.filter(cp => cp.status !== 'paga').map(cp => {
                    const dtVenc = parseData(cp.dataVencimento);
                    const isVencida = dtVenc && dtVenc < new Date();
                    return (
                      <div key={cp.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{cp.fornecedor || 'Fornecedor'}</p>
                          <p className="text-[11px] text-slate-400">
                            {cp.descricao || cp.categoria} • Vencimento: {dtVenc ? formatarData(dtVenc) : '-'}
                            {isVencida && <span className="ml-2 text-rose-500 font-bold uppercase">Vencida</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                            R$ {formatCurrency(cp.valor)}
                          </span>
                          <button
                            onClick={() => {
                              setModalAberto(null);
                              abrirBaixa(cp, 'pagar');
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-[10px] font-semibold"
                          >
                            Pagar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {dadosFiltrados.contasPagar.filter(cp => cp.status !== 'paga').length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhuma conta pendente a pagar.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {modalAberto === 'despesas' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Despesas Realizadas</h3>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    R$ {formatCurrency(estatisticas.totalDespesas)}
                  </p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Compras de Estoque Realizadas ({dadosFiltrados.compras.length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dadosFiltrados.compras.map(compra => (
                      <div key={compra.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{compra.fornecedor || 'Fornecedor'}</p>
                          <p className="text-[11px] text-slate-400">
                            {compra.codigoCompra ? `#${compra.codigoCompra} • ` : ''}{compra.dataCompra ? formatarData(compra.dataCompra) : '-'}
                          </p>
                        </div>
                        <p className="font-bold text-xs text-rose-600 dark:text-rose-400">
                          R$ {formatCurrency(compra.valorTotal)}
                        </p>
                      </div>
                    ))}
                    {dadosFiltrados.compras.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma compra no período.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Contas Quitadas ({dadosFiltrados.contasPagar.filter(cp => cp.status === 'paga').length})
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dadosFiltrados.contasPagar.filter(cp => cp.status === 'paga').map(cp => (
                      <div key={cp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{cp.fornecedor || 'Fornecedor'}</p>
                          <p className="text-[11px] text-slate-400">{cp.descricao || cp.categoria}</p>
                        </div>
                        <p className="font-bold text-xs text-rose-600 dark:text-rose-400">
                          R$ {formatCurrency(cp.valorPago || cp.valor)}
                        </p>
                      </div>
                    ))}
                    {dadosFiltrados.contasPagar.filter(cp => cp.status === 'paga').length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">Nenhuma conta quitada no período.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalAberto === 'saldo' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Demonstrativo de Saldo</h3>
                  <p className="text-xs text-slate-500">Cálculo de resultado financeiro do período</p>
                </div>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-1">Total Entradas</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">R$ {formatCurrency(estatisticas.totalReceitas)}</span>
                  </div>
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-1">Total Saídas</span>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">R$ {formatCurrency(estatisticas.totalDespesas)}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Entradas Líquidas:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">+ R$ {formatCurrency(estatisticas.totalReceitas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Saídas / Despesas:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">- R$ {formatCurrency(estatisticas.totalDespesas)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Resultado Líquido:</span>
                    <span className={`font-bold ${
                      estatisticas.saldo >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'brand-text'
                    }`}>
                      R$ {formatCurrency(Math.abs(estatisticas.saldo))} ({estatisticas.saldo >= 0 ? 'Positivo' : 'Negativo'})
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Previsão a Receber:</span>
                  <span className="font-bold">R$ {formatCurrency(estatisticas.totalAReceber)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Modal Ver Todas (Receber) */}
        {modalAberto === 'todasReceber' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalAberto(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Todas as Contas a Receber
                </h3>
                <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Origem / Entidade</th>
                        <th className="py-2.5 px-3">Descrição</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-center">Vencimento</th>
                        <th className="py-2.5 px-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {listaContasReceber.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            {item.clienteNome || 'Cliente'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                            {item.descricao || item.categoria || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            R$ {formatCurrency(item.valor)}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300">
                            {item.dataVencimento ? formatarData(item.dataVencimento) : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setModalAberto(null);
                                abrirBaixa(item, 'receber');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                            >
                              Receber
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}