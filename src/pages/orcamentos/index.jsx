import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Edit, 
  Trash2, 
  ArrowRight,
  ShieldAlert,
  Calendar,
  DollarSign,
  Wrench,
  UserCheck,
  Check
} from 'lucide-react';
import PageLayout from '../../components/layout-new/PageLayout';
import Modal from '../../components/modals/Modal';
import OrcamentoForm from '../../components/forms/OrcamentoForm';
import { useOrcamentos } from '../../hooks/useOrcamentos';
import { useOrdensServico } from '../../hooks/useOrdensServico';
import { useTecnicos } from '../../hooks/useTecnicos';
import { gerarPdfOrcamento } from '../../utils/pdfOrcamento';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';

const STATUS_CONFIG = {
  aguardando: { label: 'Aguardando', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  enviado:    { label: 'Enviado',    bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400' },
  aprovado:   { label: 'Aprovado',   bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  recusado:   { label: 'Recusado',   bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400' },
  rascunho:   { label: 'Rascunho',   bg: 'bg-slate-100 dark:bg-slate-700',    text: 'text-slate-700 dark:text-slate-300' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-slate-200 dark:bg-slate-800',    text: 'text-slate-500 dark:text-slate-400' }
};

export default function OrcamentosPage() {
  const navigate = useNavigate();
  const { 
    orcamentos, 
    loading, 
    error, 
    listarOrcamentos, 
    adicionarOrcamento, 
    atualizarOrcamento, 
    alterarStatusOrcamento, 
    deletarOrcamento 
  } = useOrcamentos();

  const { adicionarOrdemServico } = useOrdensServico();
  const { tecnicos, listarTecnicos } = useTecnicos();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [orcamentoEditar, setOrcamentoEditar] = useState(null);
  const [orcamentoExcluir, setOrcamentoExcluir] = useState(null);
  const [gerandoPdfId, setGerandoPdfId] = useState(null);

  // Estados do Pop-up de Aprovação e Agendamento da OS
  const [orcamentoParaAprovar, setOrcamentoParaAprovar] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horarioAgendamento, setHorarioAgendamento] = useState('09:00');
  const [tecnicoSelecionadoId, setTecnicoSelecionadoId] = useState('');
  const [tipoServicoOS, setTipoServicoOS] = useState('Instalação');
  const [instrucoesOS, setInstrucoesOS] = useState('');
  const [salvandoAprovacao, setSalvandoAprovacao] = useState(false);
  const [sucessoOS, setSucessoOS] = useState(null);

  useEffect(() => {
    listarOrcamentos();
    listarTecnicos();
  }, [listarOrcamentos, listarTecnicos]);

  // Filtros em memória
  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(orc => {
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo || (
        orc.codigoOrcamento?.includes(termo) ||
        orc.clienteNome?.toLowerCase().includes(termo) ||
        orc.clienteCpf?.includes(termo)
      );

      const matchStatus = filtroStatus === 'todos' || orc.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [orcamentos, busca, filtroStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = orcamentos.length;
    const aguardando = orcamentos.filter(o => o.status === 'aguardando' || o.status === 'enviado').length;
    const aprovados = orcamentos.filter(o => o.status === 'aprovado');
    const valorAprovados = aprovados.reduce((acc, o) => acc + (parseFloat(o.valorTotal) || 0), 0);
    const recusados = orcamentos.filter(o => o.status === 'recusado').length;

    return { total, aguardando, aprovadosQtd: aprovados.length, valorAprovados, recusados };
  }, [orcamentos]);

  const handleSalvar = async (dados) => {
    try {
      if (orcamentoEditar) {
        await atualizarOrcamento(orcamentoEditar.id, dados);
      } else {
        await adicionarOrcamento(dados);
      }
      setModalFormAberto(false);
      setOrcamentoEditar(null);
      await listarOrcamentos();
    } catch (err) {
      alert('Erro ao salvar orçamento: ' + err.message);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!orcamentoExcluir) return;
    try {
      await deletarOrcamento(orcamentoExcluir.id);
      setOrcamentoExcluir(null);
      await listarOrcamentos();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await alterarStatusOrcamento(id, novoStatus);
      await listarOrcamentos();
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // Abrir Modal de Aprovação com Pop-up de Agendamento
  const handleAbrirAprovacao = (orc) => {
    setOrcamentoParaAprovar(orc);
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    setDataAgendamento(amanha.toISOString().split('T')[0]);
    setHorarioAgendamento('09:00');
    setTecnicoSelecionadoId(tecnicos[0]?.id || '');
    setTipoServicoOS('Instalação');

    const descServicos = (orc.servicos || []).map(s => `${s.quantidade || 1}x ${s.descricao}`).join(', ');
    setInstrucoesOS(descServicos || orc.observacoes || `Instalação referente ao Orçamento #${orc.codigoOrcamento}`);
  };

  // Confirmar Aprovação e Gerar OS Automaticamente
  const handleConfirmarAprovacao = async (e) => {
    if (e) e.preventDefault();
    if (!orcamentoParaAprovar) return;
    if (!dataAgendamento) {
      alert('Por favor, informe a data prevista para o serviço.');
      return;
    }

    try {
      setSalvandoAprovacao(true);
      const orc = orcamentoParaAprovar;
      const tec = tecnicos.find(t => t.id === tecnicoSelecionadoId);

      // 1. Atualizar status da proposta para aprovado
      await alterarStatusOrcamento(orc.id, 'aprovado');

      // 2. Mapear produtos para materiais prontos para baixa na OS
      const materiaisUtilizados = (orc.produtos || []).map(p => ({
        produtoId: p.produtoId || '',
        nome: p.nome || '',
        quantidade: parseFloat(p.quantidade) || 1,
        valorUnitario: parseFloat(p.valorUnitario) || 0,
        unidade: p.unidade || 'un',
        instalarNoCliente: true
      }));

      // 3. Montar dados da OS integrada
      const dataHoraTexto = `${dataAgendamento} às ${horarioAgendamento || '09:00'}`;
      const dadosOS = {
        clienteId: orc.clienteId || '',
        clienteNome: orc.clienteNome || 'Consumidor',
        clienteTelefone: orc.clienteTelefone || orc.clienteWhatsapp || '',
        clienteEndereco: orc.clienteEndereco || orc.enderecoCliente || '',
        tecnicoId: tec?.id || '',
        tecnicoNome: tec?.nome || 'A definir',
        tipoServico: tipoServicoOS || 'Instalação',
        descricaoProblema: instrucoesOS || `Instalação referente ao Orçamento #${orc.codigoOrcamento}`,
        materiaisUtilizados,
        valorMaoDeObra: parseFloat(orc.subtotalServicos) || 0,
        valorMateriais: parseFloat(orc.subtotalProdutos) || 0,
        valorTotal: parseFloat(orc.valorTotal) || 0,
        desconto: parseFloat(orc.desconto) || 0,
        status: 'agendada',
        dataAgendamento: dataHoraTexto,
        observacoes: `Gerada automaticamente do Orçamento #${orc.codigoOrcamento}. ${orc.observacoes || ''}`.trim(),
        orcamentoOrigemId: orc.id,
        orcamentoOrigemCodigo: orc.codigoOrcamento
      };

      const novaOS = await adicionarOrdemServico(dadosOS);
      await listarOrcamentos();

      // Fechar modal de formulário e abrir feedback de sucesso
      setOrcamentoParaAprovar(null);
      setSucessoOS({
        codigoOS: novaOS.codigoOS,
        osId: novaOS.id,
        orcamentoCodigo: orc.codigoOrcamento,
        dataAgendamento: dataHoraTexto,
        tecnicoNome: tec?.nome || 'A definir'
      });
    } catch (err) {
      console.error('Erro ao aprovar e gerar OS:', err);
      alert('Erro ao aprovar proposta e gerar OS: ' + err.message);
    } finally {
      setSalvandoAprovacao(false);
    }
  };

  const handleBaixarPdf = async (orcamento) => {
    try {
      setGerandoPdfId(orcamento.id);
      await gerarPdfOrcamento(orcamento);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF: ' + err.message);
    } finally {
      setGerandoPdfId(null);
    }
  };

  return (
    <PageLayout title="Orçamentos & Propostas Comerciais">
      <div className="space-y-6">
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Propostas</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
              <FileText size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Aguardando Aprovação</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.aguardando}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Propostas Aprovadas</p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.aprovadosQtd} <span className="text-xs font-normal">({formatCurrency(stats.valorAprovados)})</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Recusadas / Canceladas</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.recusados}</h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl">
              <XCircle size={22} />
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES: BUSCA + FILTROS + NOVO ORÇAMENTO */}
        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por código, cliente, CPF/CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-end">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="aguardando">Aguardando Aprovação</option>
              <option value="enviado">Enviado</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
              <option value="rascunho">Rascunho</option>
            </select>

            <button
              onClick={() => {
                setOrcamentoEditar(null);
                setModalFormAberto(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
            >
              <Plus size={18} />
              Novo Orçamento
            </button>
          </div>
        </div>

        {/* TABELA DE ORÇAMENTOS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner size="md" text="Carregando orçamentos..." />
              </div>
            ) : orcamentosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <FileText className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
                <p className="font-medium text-base">Nenhum orçamento encontrado</p>
                <p className="text-xs text-slate-400 mt-1">Crie uma nova proposta comercial clicando no botão acima.</p>
              </div>
            ) : (
              <table className="min-w-[800px] w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Proposta</th>
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-5 py-3.5">Composição</th>
                    <th className="px-5 py-3.5">Total Geral</th>
                    <th className="px-5 py-3.5">Validade</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                  {orcamentosFiltrados.map((orc) => {
                    const statusCfg = STATUS_CONFIG[orc.status] || STATUS_CONFIG.aguardando;
                    const dataCriacao = orc.criadoEm?.toDate ? orc.criadoEm.toDate() : new Date(orc.criadoEm || Date.now());

                    return (
                      <tr key={orc.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            #{orc.codigoOrcamento || '00000'}
                          </span>
                          <p className="text-xs text-slate-400">{dataCriacao.toLocaleDateString('pt-BR')}</p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{orc.clienteNome || 'Consumidor'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {orc.clienteTelefone || orc.clienteWhatsapp || orc.clienteCpf || '-'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            <p>Equipamentos: {(orc.produtos || []).length} itens</p>
                            <p className="text-slate-400">Serviços: {(orc.servicos || []).length} itens</p>
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            R$ {formatCurrency(orc.valorTotal || 0)}
                          </span>
                          {orc.desconto > 0 && (
                            <p className="text-[11px] text-emerald-600">Desc: -R$ {formatCurrency(orc.desconto)}</p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                          {orc.validadeDias || 15} dias
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Download PDF */}
                            <button
                              onClick={() => handleBaixarPdf(orc)}
                              disabled={gerandoPdfId === orc.id}
                              className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                              title="Baixar Proposta em PDF"
                            >
                              <Download size={17} />
                            </button>

                            {/* Botão Aprovar e Agendar OS */}
                            {orc.status !== 'aprovado' && (
                              <button
                                onClick={() => handleAbrirAprovacao(orc)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors flex items-center gap-1"
                                title="Aprovar Proposta e Gerar OS"
                              >
                                <CheckCircle size={17} />
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setOrcamentoEditar(orc);
                                setModalFormAberto(true);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                              title="Editar Orçamento"
                            >
                              <Edit size={17} />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => setOrcamentoExcluir(orc)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                              title="Excluir Orçamento"
                            >
                              <Trash2 size={17} />
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
        </div>

        {/* MODAL FORMULÁRIO DE ORÇAMENTO */}
        <Modal
          isOpen={modalFormAberto}
          onClose={() => {
            setModalFormAberto(false);
            setOrcamentoEditar(null);
          }}
          title={orcamentoEditar ? `Editar Orçamento #${orcamentoEditar.codigoOrcamento}` : 'Novo Orçamento de Segurança Eletrônica'}
          size="xl"
        >
          <OrcamentoForm
            initialData={orcamentoEditar}
            onSubmit={handleSalvar}
            onCancel={() => {
              setModalFormAberto(false);
              setOrcamentoEditar(null);
            }}
          />
        </Modal>

        {/* MODAL DE APROVAÇÃO COM AGENDAMENTO E GERAÇÃO AUTOMÁTICA DE OS */}
        <Modal
          isOpen={!!orcamentoParaAprovar}
          onClose={() => !salvandoAprovacao && setOrcamentoParaAprovar(null)}
          title={`Aprovar Orçamento #${orcamentoParaAprovar?.codigoOrcamento} & Gerar OS`}
          size="lg"
        >
          {orcamentoParaAprovar && (
            <form onSubmit={handleConfirmarAprovacao} className="space-y-5">
              {/* Resumo do Orçamento */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-orange-700 dark:text-orange-400">Cliente</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {orcamentoParaAprovar.clienteNome || 'Cliente não identificado'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {orcamentoParaAprovar.clienteTelefone || orcamentoParaAprovar.clienteWhatsapp || 'Sem telefone informado'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs uppercase font-bold tracking-wider text-orange-700 dark:text-orange-400">Valor Total</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    R$ {formatCurrency(orcamentoParaAprovar.valorTotal || 0)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(orcamentoParaAprovar.produtos || []).length} produtos • {(orcamentoParaAprovar.servicos || []).length} serviços
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg flex items-center gap-2">
                <Check className="text-emerald-500 flex-shrink-0" size={16} />
                <span>Ao confirmar, o orçamento será <strong>Aprovado</strong> e uma nova <strong>Ordem de Serviço</strong> será criada com todos os equipamentos e valores da proposta.</span>
              </div>

              {/* Grid de Agendamento: Data, Hora, Técnico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} className="text-orange-500" />
                    Data Prevista de Execução *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-orange-500" />
                    Horário Previsto *
                  </label>
                  <input
                    type="time"
                    required
                    value={horarioAgendamento}
                    onChange={(e) => setHorarioAgendamento(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-orange-500" />
                    Técnico Responsável
                  </label>
                  <select
                    value={tecnicoSelecionadoId}
                    onChange={(e) => setTecnicoSelecionadoId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">A definir na triagem</option>
                    {tecnicos.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nome} {t.especialidade ? `(${t.especialidade})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Wrench size={14} className="text-orange-500" />
                    Tipo de Serviço
                  </label>
                  <select
                    value={tipoServicoOS}
                    onChange={(e) => setTipoServicoOS(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Instalação">Instalação Completa</option>
                    <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                    <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                    <option value="Configuração / Reparo">Configuração / Reparo</option>
                    <option value="Troca de Equipamento">Troca de Equipamento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição do Serviço / Instruções para a Equipe
                </label>
                <textarea
                  rows={3}
                  value={instrucoesOS}
                  onChange={(e) => setInstrucoesOS(e.target.value)}
                  placeholder="Ex: Instalação de kit CFTV 4 câmeras e fechadura digital..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  disabled={salvandoAprovacao}
                  onClick={() => setOrcamentoParaAprovar(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvandoAprovacao}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {salvandoAprovacao ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Aprovando e Gerando OS...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Aprovar & Gerar OS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL DE SUCESSO APÓS GERAÇÃO DA OS */}
        <Modal
          isOpen={!!sucessoOS}
          onClose={() => setSucessoOS(null)}
          title="Proposta Aprovada com Sucesso!"
          size="md"
        >
          {sucessoOS && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Ordem de Serviço #{sucessoOS.codigoOS} Gerada!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  O Orçamento <strong>#{sucessoOS.orcamentoCodigo}</strong> foi aprovado e a OS foi agendada para:
                </p>
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-1 text-left sm:text-center">
                  <p><strong>Data & Horário:</strong> {sucessoOS.dataAgendamento}</p>
                  <p><strong>Técnico Responsável:</strong> {sucessoOS.tecnicoNome}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
                <button
                  onClick={() => setSucessoOS(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Continuar em Orçamentos
                </button>
                <button
                  onClick={() => {
                    setSucessoOS(null);
                    navigate('/ordens-servico');
                  }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Ir para Ordens de Serviço</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
        <Modal
          isOpen={!!orcamentoExcluir}
          onClose={() => setOrcamentoExcluir(null)}
          title="Excluir Orçamento"
        >
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              Tem certeza que deseja excluir o orçamento <strong>#{orcamentoExcluir?.codigoOrcamento}</strong> do cliente <strong>{orcamentoExcluir?.clienteNome}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setOrcamentoExcluir(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
              >
                Excluir
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
}
