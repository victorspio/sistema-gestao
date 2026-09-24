import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '../../hooks/useClientes';
import { useEstoque } from '../../hooks/useEstoque';
import { useDebounce } from '../../hooks/useDebounce';
import PageLayout from '../../components/layout-new/PageLayout';
import ClienteForm from '../../components/forms/ClienteForm';
import Modal from '../../components/modals/Modal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  History,
  Users,
  X,
  Eye,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  Filter,
  RotateCcw
} from 'lucide-react';
import { ClientesSkeleton, LoadingSpinner, EmptyState } from '../../components/ui/LoadingComponents';
import { useVendas } from '../../hooks/useVendas';
import { formatQuantity, formatarData } from '../../utils/formatters';

export default function ClientesPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoPessoaFiltro, setTipoPessoaFiltro] = useState('todos'); // 'todos', 'PF', 'PJ'
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);
  const [formError, setFormError] = useState(null);
  const [carregamentoInicial, setCarregamentoInicial] = useState(true);
  const [showHistorico, setShowHistorico] = useState(false);
  const [clienteHistorico, setClienteHistorico] = useState(null);
  const [historicoCompras, setHistoricoCompras] = useState([]);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [clienteDetalhes, setClienteDetalhes] = useState(null);

  const {
    clientes,
    loading,
    savingLoading,
    error,
    isOnline,
    listarClientes,
    adicionarCliente,
    atualizarCliente,
    deletarCliente,
    obterHistoricoCliente,
    invalidarCache
  } = useClientes();

  const { produtos, listarProdutos } = useEstoque();

  // Debounce para busca
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Carregamento inicial otimizado
  useEffect(() => {
    let mounted = true;
    listarClientes().finally(() => {
      if (mounted) setCarregamentoInicial(false);
    });
    listarProdutos().catch(err => console.error('Erro ao carregar produtos:', err));
    return () => { mounted = false; };
  }, [listarClientes, listarProdutos]);

  // Recarrega clientes quando o termo de busca muda (com debounce)
  useEffect(() => {
    if (!carregamentoInicial) {
      listarClientes(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Filtragem no frontend por tipo de pessoa (PF / PJ)
  const clientesFiltrados = useMemo(() => {
    if (tipoPessoaFiltro === 'todos') return clientes;
    return clientes.filter(c => (c.tipoPessoa || 'PF') === tipoPessoaFiltro);
  }, [clientes, tipoPessoaFiltro]);

  // Estatísticas / KPIs dos Clientes
  const stats = useMemo(() => {
    const total = clientes.length;
    const pf = clientes.filter(c => (c.tipoPessoa || 'PF') === 'PF').length;
    const pj = clientes.filter(c => c.tipoPessoa === 'PJ').length;
    const comContato = clientes.filter(c => Boolean(c.telefone || c.whatsapp || c.email)).length;
    return { total, pf, pj, comContato };
  }, [clientes]);

  const handleSubmit = useCallback(async (data) => {
    try {
      setFormError(null);

      if (data === null) {
        setShowForm(false);
        setClienteParaEditar(null);
        return;
      }

      if (clienteParaEditar) {
        await atualizarCliente(clienteParaEditar.id, data);
        setClienteParaEditar(null);
      } else {
        await adicionarCliente(data);
      }

      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    }
  }, [clienteParaEditar, atualizarCliente, adicionarCliente]);

  const handleExcluir = useCallback(async () => {
    try {
      const clienteId = clienteParaExcluir.id;
      setClienteParaExcluir(null);
      await deletarCliente(clienteId);
      invalidarCache();
    } catch (err) {
      await listarClientes(debouncedSearchTerm);
    }
  }, [clienteParaExcluir, deletarCliente, invalidarCache, debouncedSearchTerm, listarClientes]);

  const handleShowHistorico = useCallback(async (cliente) => {
    try {
      setClienteHistorico(cliente);
      setShowHistorico(true);
      setHistoricoCompras([]);

      try {
        const historico = await obterHistoricoCliente(cliente.id);
        setHistoricoCompras(historico || []);
      } catch (error) {
        console.error('Erro ao buscar histórico do cliente:', error);
        setHistoricoCompras([]);
      }
    } catch (error) {
      console.error('Erro ao abrir histórico do cliente:', error);
    }
  }, [obterHistoricoCliente]);

  const handleVerDetalhes = useCallback((cliente) => {
    setClienteDetalhes(cliente);
    setShowDetalhes(true);
  }, []);

  const getNomeProduto = useCallback((produtoId) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : 'Produto não identificado';
  }, [produtos]);

  const obterIniciais = (nome) => {
    if (!nome) return 'CL';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  return (
    <PageLayout title="Clientes">
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* 1. CABEÇALHO */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <Users size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Clientes
                </h1>
                <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                  {stats.total} cadastrados
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gerencie seus clientes, contatos, localizações e histórico de compras.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
              >
                <Plus size={18} />
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          {!isOnline && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Modo offline ativo - algumas operações serão sincronizadas assim que a conexão retornar.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. CARDS DE INDICADORES (KPIS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total de Clientes
              </span>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Users size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.total}
            </div>
            <p className="mt-2 text-xs text-slate-400">Base total cadastrada</p>
          </div>

          {/* Card 2: PF */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pessoa Física (PF)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <User size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.pf}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats.total > 0 ? `${((stats.pf / stats.total) * 100).toFixed(0)}% da base` : '0%'}
            </p>
          </div>

          {/* Card 3: PJ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pessoa Jurídica (PJ)
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.pj}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats.total > 0 ? `${((stats.pj / stats.total) * 100).toFixed(0)}% da base` : '0%'}
            </p>
          </div>

          {/* Card 4: Contato */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Com Contato Válido
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Phone size={20} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.comContato}
            </div>
            <p className="mt-2 text-xs text-slate-400">Telefone, WhatsApp ou e-mail</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FILTROS & BARRA DE BUSCA */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 transition-all">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

            {/* Filtro Tipo PF/PJ */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                onClick={() => setTipoPessoaFiltro('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoPessoaFiltro === 'todos'
                    ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setTipoPessoaFiltro('PF')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoPessoaFiltro === 'PF'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pessoa Física ({stats.pf})
              </button>
              <button
                onClick={() => setTipoPessoaFiltro('PJ')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoPessoaFiltro === 'PJ'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pessoa Jurídica ({stats.pj})
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. TABELA DE CLIENTES */}
        {/* ========================================================================= */}
        {loading && carregamentoInicial ? (
          <ClientesSkeleton />
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="text-rose-500 font-semibold mb-2">
              {isOnline ? 'Erro ao carregar clientes' : 'Sem conexão'}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => listarClientes(debouncedSearchTerm)}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={Users}
              title={searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              description={searchTerm ? 'Tente ajustar os termos de busca ou filtros' : 'Comece cadastrando seu primeiro cliente no sistema'}
              actionText={!searchTerm ? 'Novo Cliente' : undefined}
              onAction={!searchTerm ? () => setShowForm(true) : undefined}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Contato</th>
                    <th className="py-3.5 px-4">CPF / CNPJ</th>
                    <th className="py-3.5 px-4">Localização</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            cliente.tipoPessoa === 'PJ'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {obterIniciais(cliente.nome)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                cliente.tipoPessoa === 'PJ'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              }`}>
                                {cliente.tipoPessoa || 'PF'}
                              </span>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {cliente.nome}
                              </p>
                            </div>
                            {(cliente.apelido || cliente.razaoSocial) && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {cliente.apelido || cliente.razaoSocial}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-200 font-medium">
                            {cliente.telefone || '-'}
                          </p>
                          {cliente.whatsapp && cliente.whatsapp !== cliente.telefone && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Zap: {cliente.whatsapp}
                            </p>
                          )}
                          {cliente.email && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {cliente.cpf || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {[cliente.bairro, cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || 'Não informado'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleVerDetalhes(cliente)}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-all"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleShowHistorico(cliente)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all"
                            title="Histórico de compras"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setClienteParaEditar(cliente);
                              setShowForm(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                            title="Editar cliente"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setClienteParaExcluir(cliente)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            title="Excluir cliente"
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
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        cliente.tipoPessoa === 'PJ'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {obterIniciais(cliente.nome)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            cliente.tipoPessoa === 'PJ'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {cliente.tipoPessoa || 'PF'}
                          </span>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {cliente.nome}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cliente.telefone || 'Sem telefone'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleVerDetalhes(cliente)}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg"
                        title="Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleShowHistorico(cliente)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg"
                        title="Histórico"
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setClienteParaEditar(cliente);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setClienteParaExcluir(cliente)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p><span className="font-medium text-slate-700 dark:text-slate-300">Documento:</span> {cliente.cpf || 'Não informado'}</p>
                    {cliente.cidade && (
                      <p><span className="font-medium text-slate-700 dark:text-slate-300">Cidade:</span> {[cliente.bairro, cliente.cidade].filter(Boolean).join(' - ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL FORMULÁRIO DE CADASTRO / EDIÇÃO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            if (!savingLoading) {
              setShowForm(false);
              setClienteParaEditar(null);
            }
          }}
          title={clienteParaEditar ? 'Editar Cliente' : 'Novo Cliente'}
          size="lg"
        >
          <div className={savingLoading ? 'opacity-75 pointer-events-none' : ''}>
            {formError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {formError}
              </div>
            )}
            {savingLoading && (
              <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl flex items-center gap-2 text-xs">
                <LoadingSpinner size="sm" />
                <span>Salvando dados do cliente...</span>
              </div>
            )}
            <ClienteForm
              onSubmit={handleSubmit}
              initialData={clienteParaEditar}
              isEditing={!!clienteParaEditar}
            />
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!clienteParaExcluir}
          onClose={() => setClienteParaExcluir(null)}
          title="Confirmar Exclusão"
          footer={
            <div className="flex items-center gap-2 justify-end">
              <button
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
                onClick={() => setClienteParaExcluir(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                onClick={handleExcluir}
              >
                Excluir Cliente
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
                  Excluir {clienteParaExcluir?.nome}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tem certeza que deseja remover este cliente? Todos os dados associados a este registro deixarão de ser vinculados.
                </p>
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL HISTÓRICO DE COMPRAS */}
        {/* ========================================================================= */}
        {showHistorico && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowHistorico(false)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Histórico de Compras
                  </h3>
                  <p className="text-xs text-slate-500">{clienteHistorico?.nome}</p>
                </div>
                <button
                  onClick={() => setShowHistorico(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                {historicoCompras.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Nenhuma compra registrada para este cliente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historicoCompras.map((venda) => (
                      <div
                        key={venda.id}
                        onClick={() => navigate('/vendas', { state: { vendaId: venda.id } })}
                        className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-cyan-400 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {venda.dataVenda ? formatarData(venda.dataVenda) : '-'}
                          </span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            R$ {(venda.valorTotal || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                          {venda.itens && venda.itens.length > 0 ? (
                            venda.itens.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate max-w-[200px]">{item.produtoNome || getNomeProduto(item.produto)}</span>
                                <span>{formatQuantity(item.quantidade || 1)}x R$ {(item.valorUnitario || 0).toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <span className="italic text-slate-400">Itens não detalhados</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL DETALHES DO CLIENTE */}
        {/* ========================================================================= */}
        <Modal
          isOpen={showDetalhes}
          onClose={() => {
            setShowDetalhes(false);
            setClienteDetalhes(null);
          }}
          title="Detalhes do Cliente"
          size="lg"
        >
          {clienteDetalhes && (
            <div className="space-y-5 p-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600">
                    <User size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Dados Principais ({clienteDetalhes.tipoPessoa || 'PF'})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Nome / Razão Social:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{clienteDetalhes.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Documento (CPF/CNPJ):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{clienteDetalhes.cpf || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Telefone:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.telefone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">WhatsApp:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{clienteDetalhes.whatsapp || '-'}</span>
                  </div>
                  {clienteDetalhes.email && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block mb-0.5">E-mail:</span>
                      <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600">
                    <MapPin size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Endereço de Atendimento
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Logradouro:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.endereco || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Complemento:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.complemento || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bairro:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.bairro || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Cidade:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.cidade || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Estado:</span>
                    <span className="text-slate-800 dark:text-slate-200">{clienteDetalhes.estado || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {clienteDetalhes.observacoes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-xs">
                  <span className="text-slate-400 font-semibold block mb-1">Observações Técnicas:</span>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{clienteDetalhes.observacoes}</p>
                </div>
              )}

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowDetalhes(false);
                    handleShowHistorico(clienteDetalhes);
                  }}
                  className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <History size={15} />
                  Ver Histórico de Compras
                </button>
                <button
                  onClick={() => {
                    setClienteParaEditar(clienteDetalhes);
                    setShowDetalhes(false);
                    setShowForm(true);
                  }}
                  className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Edit size={15} />
                  Editar Cliente
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageLayout>
  );
}