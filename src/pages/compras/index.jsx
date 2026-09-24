import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompras } from '../../hooks/useCompras';
import { useDebounce } from '../../hooks/useDebounce';
import PageLayout from '../../components/layout-new/PageLayout';
import CompraForm from '../../components/forms/CompraForm';
import Modal from '../../components/modals/Modal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ShoppingBag,
  Package,
  Eye,
  Calendar,
  DollarSign,
  Building2,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/ui/LoadingComponents';
import { formatCurrency, formatQuantity, formatarData } from '../../utils/formatters';

export default function ComprasPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [compraParaEditar, setCompraParaEditar] = useState(null);
  const [compraParaExcluir, setCompraParaExcluir] = useState(null);
  const [compraDetalhes, setCompraDetalhes] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [carregamentoInicial, setCarregamentoInicial] = useState(true);

  const {
    compras,
    loading,
    error,
    listarCompras,
    adicionarCompra,
    atualizarCompra,
    deletarCompra
  } = useCompras();

  // Debounce para busca
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Carregamento inicial
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        await listarCompras();
      } catch (error) {
        console.error('Erro ao carregar compras:', error);
      } finally {
        setCarregamentoInicial(false);
      }
    };
    carregarDadosIniciais();
  }, []);

  // Recarrega compras quando a busca muda (com debounce)
  useEffect(() => {
    if (!carregamentoInicial) {
      listarCompras(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Estatísticas / KPIs de Compras
  const stats = useMemo(() => {
    const total = compras.length;
    const totalValor = compras.reduce((acc, c) => acc + (parseFloat(c.valorTotal) || 0), 0);
    const fornecedoresUnicos = new Set(compras.map(c => c.fornecedor?.trim().toLowerCase()).filter(Boolean)).size;
    const mediaPorCompra = total > 0 ? totalValor / total : 0;

    return { total, totalValor, fornecedoresUnicos, mediaPorCompra };
  }, [compras]);

  const handleSubmit = useCallback(async (data) => {
    try {
      if (data === null) {
        setShowForm(false);
        setCompraParaEditar(null);
        return;
      }

      if (compraParaEditar) {
        await atualizarCompra(compraParaEditar.id, data);
        setCompraParaEditar(null);
      } else {
        await adicionarCompra(data);
      }

      setSearchTerm('');
      setShowForm(false);
      await listarCompras('');
    } catch (err) {
      console.error('Erro ao salvar compra:', err);
      alert('Erro ao salvar compra: ' + err.message);
    }
  }, [compraParaEditar, atualizarCompra, adicionarCompra, listarCompras]);

  const handleExcluir = useCallback(async () => {
    try {
      await deletarCompra(compraParaExcluir.id);
      setCompraParaExcluir(null);
      await listarCompras(debouncedSearchTerm);
    } catch (err) {
      console.error('Erro ao excluir compra:', err);
    }
  }, [compraParaExcluir, deletarCompra, debouncedSearchTerm, listarCompras]);

  return (
    <PageLayout title="Compras">
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <ShoppingBag size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Compras
                </h1>
                <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                  {stats.total} compras realizadas
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Registre e gerencie as compras de mercadorias e reposição de estoque.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCompraParaEditar(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <Plus size={18} />
                <span>Nova Compra</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CARDS DE INDICADORES (KPIS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Investido */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Investido
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              R$ {formatCurrency(stats.totalValor)}
            </div>
            <p className="mt-2 text-xs text-slate-400">Total em aquisição de estoque</p>
          </div>

          {/* Card 2: Total de Compras */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Compras Realizadas
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.total}
            </div>
            <p className="mt-2 text-xs text-slate-400">Registros de pedidos</p>
          </div>

          {/* Card 3: Fornecedores Distintos */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fornecedores
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.fornecedoresUnicos}
            </div>
            <p className="mt-2 text-xs text-slate-400">Fornecedores parceiros</p>
          </div>

          {/* Card 4: Média por Compra */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Média por Pedido
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Package size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              R$ {formatCurrency(stats.mediaPorCompra)}
            </div>
            <p className="mt-2 text-xs text-slate-400">Ticket médio de compras</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FILTROS & BARRA DE BUSCA */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-all">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por fornecedor, código da compra ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
        {/* ========================================================================= */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 transition-all">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 rounded-xl">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {compraParaEditar ? 'Editar Compra' : 'Registrar Nova Compra'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Os itens comprados serão adicionados ao estoque automaticamente.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowForm(false);
                  setCompraParaEditar(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <CompraForm
              onSubmit={handleSubmit}
              initialData={compraParaEditar}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TABELA DE COMPRAS */}
        {/* ========================================================================= */}
        {loading && carregamentoInicial ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <LoadingSpinner text="Carregando histórico de compras..." />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <p className="text-rose-500 font-semibold mb-2">Erro ao carregar compras</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => listarCompras(debouncedSearchTerm)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl text-xs font-semibold hover:bg-cyan-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : compras.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={ShoppingBag}
              title={searchTerm ? 'Nenhuma compra encontrada' : 'Nenhuma compra registrada'}
              description={searchTerm ? 'Tente ajustar os termos da busca' : 'Registre sua primeira compra para alimentar seu estoque'}
              actionText={!searchTerm ? 'Nova Compra' : undefined}
              onAction={!searchTerm ? () => setShowForm(true) : undefined}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Código / Fornecedor</th>
                    <th className="py-3.5 px-4">Itens Comprados</th>
                    <th className="py-3.5 px-4 text-center">Data</th>
                    <th className="py-3.5 px-4 text-center">Pagamento</th>
                    <th className="py-3.5 px-4 text-right">Valor Total</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {compras.map((compra) => (
                    <tr
                      key={compra.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {compra.codigoCompra && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  #{compra.codigoCompra}
                                </span>
                              )}
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {compra.fornecedor}
                              </p>
                            </div>
                            {compra.observacoes && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {compra.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {compra.itens && compra.itens.length > 0 ? (
                            <>
                              <p className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[220px]">
                                {compra.itens[0].nomeProduto}
                              </p>
                              {compra.itens.length > 1 && (
                                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                                  +{compra.itens.length - 1} outro(s) item(ns)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center text-slate-600 dark:text-slate-300">
                        {compra.dataCompra ? formatarData(compra.dataCompra) : '-'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full capitalize">
                          {compra.formaPagamento || 'À vista'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-slate-100">
                        R$ {formatCurrency(compra.valorTotal || 0)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setCompraDetalhes(compra);
                              setShowDetalhes(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setCompraParaEditar(compra);
                              setShowForm(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                            title="Editar compra"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setCompraParaExcluir(compra)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Excluir compra"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
              {compras.map((compra) => (
                <div key={compra.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          {compra.codigoCompra && (
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              #{compra.codigoCompra}
                            </span>
                          )}
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {compra.fornecedor}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {compra.dataCompra ? formatarData(compra.dataCompra) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCompraDetalhes(compra);
                          setShowDetalhes(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg"
                        title="Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setCompraParaEditar(compra);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setCompraParaExcluir(compra)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">
                      {compra.itens?.length || 0} item(ns)
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      R$ {formatCurrency(compra.valorTotal || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL DETALHES DA COMPRA */}
        {/* ========================================================================= */}
        <Modal
          isOpen={showDetalhes}
          onClose={() => {
            setShowDetalhes(false);
            setCompraDetalhes(null);
          }}
          title="Detalhes da Compra"
          size="lg"
        >
          {compraDetalhes && (
            <div className="space-y-5 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Código da Compra:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    #{compraDetalhes.codigoCompra || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Data da Compra:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {compraDetalhes.dataCompra ? formatarData(compraDetalhes.dataCompra) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Forma de Pagamento:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {compraDetalhes.formaPagamento || 'À vista'}
                  </span>
                </div>
                <div className="sm:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Fornecedor:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {compraDetalhes.fornecedor}
                  </span>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Produtos do Pedido ({compraDetalhes.itens?.length || 0})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Unidade</th>
                        <th className="py-2.5 px-3 text-right">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Valor Compra</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {compraDetalhes.itens?.map((item, index) => {
                        const qtd = parseFloat(item.quantidadeComprada || item.quantidade) || 0;
                        const vlr = parseFloat(item.valorCompra || item.valorUnitario) || 0;
                        return (
                          <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                              {item.nomeProduto}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                              {item.unidadeCompra || item.unidade || 'un'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                              {formatQuantity(qtd)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                              R$ {formatCurrency(vlr)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                              R$ {formatCurrency(qtd * vlr)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 font-bold">
                      <tr>
                        <td colSpan="4" className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                          Valor Total da Compra:
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 text-sm">
                          R$ {formatCurrency(compraDetalhes.valorTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {compraDetalhes.observacoes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Observações da Compra:</span>
                  <p className="text-slate-700 dark:text-slate-300">{compraDetalhes.observacoes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setCompraParaEditar(compraDetalhes);
                    setShowForm(true);
                    setShowDetalhes(false);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Edit size={15} />
                  Editar Compra
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!compraParaExcluir}
          onClose={() => setCompraParaExcluir(null)}
          title="Confirmar Exclusão"
          footer={
            <div className="flex items-center gap-2 justify-end">
              <button
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition-all"
                onClick={() => setCompraParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                onClick={handleExcluir}
              >
                Excluir Compra
              </button>
            </div>
          }
        >
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center flex-shrink-0 text-rose-600">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Excluir compra de {compraParaExcluir?.fornecedor}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem certeza que deseja excluir esta compra? O registro será removido permanentemente do histórico financeiro.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
}
