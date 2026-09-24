import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Filter,
  Eye,
  CheckCircle2,
  Boxes,
  Layers,
  ArrowUpDown,
  X,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { useEstoque } from '../../hooks/useEstoque';
import ProdutoForm from '../../components/forms/ProdutoForm';
import PageLayout from '../../components/layout-new/PageLayout';
import Modal from '../../components/modals/Modal';
import { LoadingSpinner, ProdutosSkeleton } from '../../components/ui/LoadingComponents';
import { formatCurrency, formatQuantity } from '../../utils/formatters';
import ImportarNFe from '../../components/ui/ImportarNFe';

export default function Estoque() {
  const {
    produtos,
    loading: carregando,
    error: erro,
    adicionarProduto,
    atualizarProduto,
    deletarProduto,
    listarProdutos
  } = useEstoque();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [produtoDetalhes, setProdutoDetalhes] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstoque, setFiltroEstoque] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [similarWarning, setSimilarWarning] = useState(null);

  useEffect(() => {
    listarProdutos();
  }, [listarProdutos]);

  // Categorias únicas existentes
  const categorias = useMemo(() => {
    const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
    return cats.sort();
  }, [produtos]);

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const termo = busca.trim().toLowerCase();
      const matchBusca = !termo ||
        produto.nome?.toLowerCase().includes(termo) ||
        produto.marca?.toLowerCase().includes(termo) ||
        produto.modelo?.toLowerCase().includes(termo) ||
        produto.descricao?.toLowerCase().includes(termo);

      const matchCategoria = !filtroCategoria || produto.categoria === filtroCategoria;

      let matchEstoque = true;
      if (filtroEstoque === 'baixo') {
        matchEstoque = (produto.quantidade || 0) <= (produto.estoqueMinimo || 0) && (produto.quantidade || 0) > 0;
      } else if (filtroEstoque === 'zerado') {
        matchEstoque = (produto.quantidade || 0) === 0;
      } else if (filtroEstoque === 'normal') {
        matchEstoque = (produto.quantidade || 0) > (produto.estoqueMinimo || 0);
      }

      return matchBusca && matchCategoria && matchEstoque;
    });
  }, [produtos, busca, filtroCategoria, filtroEstoque]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = produtos.length;
    const baixoEstoque = produtos.filter(p => (p.quantidade || 0) <= (p.estoqueMinimo || 0) && (p.quantidade || 0) > 0).length;
    const zerados = produtos.filter(p => (p.quantidade || 0) === 0).length;
    const valorTotal = produtos.reduce((acc, p) => acc + ((p.quantidade || 0) * (p.precoVenda || 0)), 0);

    return { total, baixoEstoque, zerados, valorTotal };
  }, [produtos]);

  const handleSubmit = async (dados, ignorarSimilaridade = false) => {
    try {
      let resultado;
      if (produtoParaEditar) {
        resultado = await atualizarProduto(produtoParaEditar.id, dados, ignorarSimilaridade);
      } else {
        resultado = await adicionarProduto(dados, ignorarSimilaridade);
      }

      if (resultado && resultado.similar) {
        setSimilarWarning({ dados, id: produtoParaEditar?.id || null, produtoSimilar: resultado.produtoSimilar });
        return;
      }

      setMostrarFormulario(false);
      setProdutoParaEditar(null);
      setSimilarWarning(null);
    } catch (error) {
      if (!error.message?.includes('Já existe')) {
        console.error('Erro ao salvar produto:', error);
      }
      setErrorMessage(error.message);
    }
  };

  const handleConfirmarSimilaridade = async () => {
    if (similarWarning) {
      const { dados } = similarWarning;
      await handleSubmit(dados, true);
    }
  };

  const handleEditar = (produto) => {
    setProdutoParaEditar(produto);
    setMostrarFormulario(true);
  };

  const handleRemover = async () => {
    if (produtoParaExcluir) {
      await deletarProduto(produtoParaExcluir.id);
      setProdutoParaExcluir(null);
    }
  };

  const getNomeUnidade = (sigla) => {
    const unidades = {
      'un': 'Unidade (un)',
      'kg': 'Quilograma (kg)',
      'g': 'Grama (g)',
      'l': 'Litro (l)',
      'ml': 'Mililitro (ml)',
      'm': 'Metro (m)',
      'cm': 'Centímetro (cm)',
      'mm': 'Milímetro (mm)',
      'cx': 'Caixa (cx)',
      'pc': 'Peça (pc)'
    };
    return unidades[sigla] || sigla || 'Unidade';
  };

  const handleLimparFiltros = () => {
    setBusca('');
    setFiltroCategoria('');
    setFiltroEstoque('todos');
  };

  return (
    <PageLayout title="Estoque & Produtos">
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <Package size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Estoque & Produtos
                </h1>
                <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                  {stats.total} itens cadastrados
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Controle seu catálogo de produtos, níveis de estoque e precificação.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ImportarNFe />

              <button
                onClick={() => {
                  setProdutoParaEditar(null);
                  setMostrarFormulario(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <Plus size={18} />
                <span>Novo Produto</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CARDS DE INDICADORES (KPIS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total de Produtos
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Boxes size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.total}
            </div>
            <p className="mt-2 text-xs text-slate-400">Produtos no catálogo</p>
          </div>

          {/* Card 2: Estoque Baixo */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estoque Baixo
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.baixoEstoque}
            </div>
            <p className="mt-2 text-xs text-slate-400">Abaixo do estoque mínimo</p>
          </div>

          {/* Card 3: Zerados */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Produtos Zerados
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
              {stats.zerados}
            </div>
            <p className="mt-2 text-xs text-slate-400">Sem estoque disponível</p>
          </div>

          {/* Card 4: Valor Total */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Valor Total (Venda)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              R$ {formatCurrency(stats.valorTotal)}
            </div>
            <p className="mt-2 text-xs text-slate-400">Patrimônio em estoque</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FILTROS & BARRA DE BUSCA */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-all">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome do produto, marca, modelo ou especificações..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Botão Alternar Filtros Avançados */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  mostrarFiltros || filtroCategoria || filtroEstoque !== 'todos'
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Filter size={16} />
                Filtros
                {(filtroCategoria || filtroEstoque !== 'todos') && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                )}
              </button>
            </div>

            {/* Painel Expansível de Filtros */}
            {mostrarFiltros && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Status do Estoque
                  </label>
                  <select
                    value={filtroEstoque}
                    onChange={(e) => setFiltroEstoque(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="todos">Todos os níveis</option>
                    <option value="normal">Estoque Normal (OK)</option>
                    <option value="baixo">Estoque Baixo</option>
                    <option value="zerado">Estoque Zerado</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleLimparFiltros}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    <RotateCcw size={14} />
                    Limpar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. TABELA DE PRODUTOS */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            {carregando ? (
              <ProdutosSkeleton />
            ) : erro ? (
              <div className="p-8 text-center">
                <p className="text-rose-500 font-semibold mb-2">{erro}</p>
                <button
                  onClick={listarProdutos}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-xl text-xs font-semibold hover:bg-cyan-600 transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Package className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={44} />
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Nenhum produto encontrado
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {busca || filtroCategoria || filtroEstoque !== 'todos'
                    ? 'Tente ajustar os filtros ou termos de pesquisa.'
                    : 'Cadastre seu primeiro produto para iniciar seu controle de estoque.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4 text-center">Estoque</th>
                    <th className="py-3.5 px-4 text-right">Preço Venda</th>
                    <th className="py-3.5 px-4 text-right">Total em Estoque</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {produtosFiltrados.map((produto) => {
                    const quantidade = produto.quantidade || 0;
                    const minimo = produto.estoqueMinimo || 0;
                    const baixoEstoque = quantidade <= minimo && quantidade > 0;
                    const zerado = quantidade === 0;

                    let statusBadge = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
                    let statusTexto = 'OK';

                    if (zerado) {
                      statusBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold';
                      statusTexto = 'Zerado';
                    } else if (baixoEstoque) {
                      statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold';
                      statusTexto = 'Baixo';
                    }

                    return (
                      <tr
                        key={produto.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs flex-shrink-0">
                              <Package size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {produto.nome}
                              </p>
                              {(produto.marca || produto.modelo) && (
                                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                                  {[produto.marca, produto.modelo].filter(Boolean).join(' • ')}
                                </p>
                              )}
                              {produto.descricao && (
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {produto.descricao}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
                            {produto.categoria || 'Sem categoria'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {formatQuantity(quantidade)} {produto.unidade || 'un'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge}`}>
                              {statusTexto}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-medium text-slate-800 dark:text-slate-200">
                          R$ {formatCurrency(produto.precoVenda || 0)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-slate-900 dark:text-slate-100">
                          R$ {formatCurrency(quantidade * (produto.precoVenda || 0))}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setProdutoDetalhes(produto);
                                setShowDetalhes(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
                              title="Ver detalhes"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditar(produto)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                              title="Editar produto"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setProdutoParaExcluir(produto)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Excluir produto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando {produtosFiltrados.length} de {produtos.length} produtos cadastrados</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FORMULÁRIO DO PRODUTO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={mostrarFormulario}
          onClose={() => {
            setMostrarFormulario(false);
            setProdutoParaEditar(null);
          }}
          title={produtoParaEditar ? 'Editar Produto' : 'Novo Produto'}
          size="xl"
        >
          <ProdutoForm
            key={produtoParaEditar ? produtoParaEditar.id : 'novo'}
            onSubmit={handleSubmit}
            initialData={produtoParaEditar}
            onCancel={() => {
              setMostrarFormulario(false);
              setProdutoParaEditar(null);
            }}
          />
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL DETALHES DO PRODUTO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={showDetalhes}
          onClose={() => {
            setShowDetalhes(false);
            setProdutoDetalhes(null);
          }}
          title="Detalhes do Produto"
          size="lg"
        >
          {produtoDetalhes && (
            <div className="space-y-5 p-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {produtoDetalhes.nome}
                  </h3>
                  {(produtoDetalhes.marca || produtoDetalhes.modelo) && (
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mt-0.5">
                      {[produtoDetalhes.marca, produtoDetalhes.modelo].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold">
                  {produtoDetalhes.categoria || 'Sem categoria'}
                </span>
              </div>

              {/* Informações de Estoque & Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Quantidade em Estoque:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatQuantity(produtoDetalhes.quantidade)} {produtoDetalhes.unidade || 'un'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Estoque Mínimo:</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatQuantity(produtoDetalhes.estoqueMinimo)} {produtoDetalhes.unidade || 'un'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Unidade Padrão:</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {getNomeUnidade(produtoDetalhes.unidade)}
                  </span>
                </div>
              </div>

              {/* Preços e Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Preço de Compra:</span>
                  <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                    R$ {formatCurrency(produtoDetalhes.precoCompra || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Preço de Venda:</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {formatCurrency(produtoDetalhes.precoVenda || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Total em Estoque:</span>
                  <span className="text-base font-bold text-cyan-600 dark:text-cyan-400">
                    R$ {formatCurrency((produtoDetalhes.quantidade || 0) * (produtoDetalhes.precoVenda || 0))}
                  </span>
                </div>
              </div>

              {/* Descrição */}
              {produtoDetalhes.descricao && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Especificações Técnicas:</span>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{produtoDetalhes.descricao}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    handleEditar(produtoDetalhes);
                    setShowDetalhes(false);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Edit size={15} />
                  Editar Produto
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!produtoParaExcluir}
          onClose={() => setProdutoParaExcluir(null)}
          title="Confirmar Exclusão"
          footer={
            <div className="flex items-center gap-2 justify-end">
              <button
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
                onClick={() => setProdutoParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                onClick={handleRemover}
              >
                Excluir Produto
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
                  Excluir {produtoParaExcluir?.nome}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem certeza que deseja remover este produto do catálogo? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL ERRO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="Aviso do Sistema"
          size="sm"
          footer={
            <button
              onClick={() => setErrorMessage(null)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold transition-all"
            >
              Entendido
            </button>
          }
        >
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-xl flex items-center justify-center mx-auto mb-3 text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {errorMessage}
            </p>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL AVISO DE PRODUTO SIMILAR */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!similarWarning}
          onClose={() => setSimilarWarning(null)}
          title="Produto Similar Detectado"
          size="sm"
          footer={
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setSimilarWarning(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition-all"
              >
                Ajustar Nome
              </button>
              <button
                onClick={handleConfirmarSimilaridade}
                className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Cadastrar Mesmo Assim
              </button>
            </div>
          }
        >
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center mx-auto mb-3 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Similaridade de Nome Encontrada
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você está tentando cadastrar <strong className="text-slate-900 dark:text-white">"{similarWarning?.dados?.nome}"</strong>, 
              mas já existe o produto <strong className="text-slate-900 dark:text-white">"{similarWarning?.produtoSimilar?.nome}"</strong> cadastrado.
            </p>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
}
