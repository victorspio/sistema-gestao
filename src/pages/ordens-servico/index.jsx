import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  Edit, 
  Trash2, 
  AlertCircle,
  Eye,
  Check,
  Download
} from 'lucide-react';
import PageLayout from '../../components/layout-new/PageLayout';
import Modal from '../../components/modals/Modal';
import OrdemServicoForm from '../../components/forms/OrdemServicoForm';
import { useOrdensServico } from '../../hooks/useOrdensServico';
import { gerarPdfOrdemServico } from '../../utils/pdfOrdemServico';
import { formatCurrency } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';

const STATUS_OS = {
  aberta:              { label: 'Aberta',              bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300' },
  agendada:            { label: 'Agendada',            bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  em_andamento:        { label: 'Em Andamento',        bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300' },
  aguardando_material: { label: 'Aguardando Material', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
  concluida:           { label: 'Concluída',           bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  cancelada:           { label: 'Cancelada',           bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300' }
};

export default function OrdensServicoPage() {
  const { 
    ordensServico, 
    loading, 
    error, 
    listarOrdensServico, 
    adicionarOrdemServico, 
    concluirOrdemServico, 
    atualizarOrdemServico, 
    deletarOrdemServico 
  } = useOrdensServico();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [osParaEditar, setOsParaEditar] = useState(null);
  const [osParaConcluir, setOsParaConcluir] = useState(null);
  const [osParaExcluir, setOsParaExcluir] = useState(null);
  const [solucaoConclusao, setSolucaoConclusao] = useState('');
  const [formaPagamentoConclusao, setFormaPagamentoConclusao] = useState('pix');
  const [pagoAgora, setPagoAgora] = useState(true);
  const [processandoConclusao, setProcessandoConclusao] = useState(false);
  const [gerandoPdfId, setGerandoPdfId] = useState(null);

  useEffect(() => {
    listarOrdensServico();
  }, [listarOrdensServico]);

  const ordensFiltradas = useMemo(() => {
    return ordensServico.filter(os => {
      const termo = busca.toLowerCase().trim();
      const matchBusca = !termo || (
        os.codigoOS?.includes(termo) ||
        os.clienteNome?.toLowerCase().includes(termo) ||
        os.tecnicoNome?.toLowerCase().includes(termo) ||
        os.tipoServico?.toLowerCase().includes(termo) ||
        os.descricaoProblema?.toLowerCase().includes(termo)
      );

      const matchStatus = filtroStatus === 'todos' || os.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [ordensServico, busca, filtroStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = ordensServico.length;
    const agendadas = ordensServico.filter(o => o.status === 'agendada' || o.status === 'aberta').length;
    const emAndamento = ordensServico.filter(o => o.status === 'em_andamento').length;
    const concluidas = ordensServico.filter(o => o.status === 'concluida').length;

    return { total, agendadas, emAndamento, concluidas };
  }, [ordensServico]);

  const handleSalvarOS = async (dados) => {
    try {
      if (osParaEditar) {
        await atualizarOrdemServico(osParaEditar.id, dados);
      } else {
        await adicionarOrdemServico(dados);
      }
      setModalFormAberto(false);
      setOsParaEditar(null);
      await listarOrdensServico();
    } catch (err) {
      alert('Erro ao salvar OS: ' + err.message);
    }
  };

  const handleAbrirConclusao = (os) => {
    setOsParaConcluir(os);
    setSolucaoConclusao(os.solucaoRealizada || 'Serviço executado e testado com sucesso.');
  };

  const handleConfirmarConclusao = async () => {
    if (!osParaConcluir) return;
    try {
      setProcessandoConclusao(true);
      await concluirOrdemServico(osParaConcluir.id, {
        solucaoRealizada: solucaoConclusao,
        formaPagamento: formaPagamentoConclusao,
        pagoAgora
      });
      setOsParaConcluir(null);
      await listarOrdensServico();
      alert('OS Concluída com sucesso! Baixa de estoque dos materiais realizada e lançamento financeiro registrado.');
    } catch (err) {
      console.error(err);
      alert('Erro ao concluir OS: ' + err.message);
    } finally {
      setProcessandoConclusao(false);
    }
  };

  const handleExcluir = async () => {
    if (!osParaExcluir) return;
    try {
      await deletarOrdemServico(osParaExcluir.id);
      setOsParaExcluir(null);
      await listarOrdensServico();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleBaixarPdf = async (os) => {
    try {
      setGerandoPdfId(os.id);
      await gerarPdfOrdemServico(os);
    } catch (err) {
      console.error('Erro ao gerar PDF da OS:', err);
      alert('Erro ao gerar PDF da Ordem de Serviço: ' + err.message);
    } finally {
      setGerandoPdfId(null);
    }
  };

  return (
    <PageLayout title="Ordens de Serviço (OS)">
      <div className="space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Ordens</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
              <Wrench size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Abertas / Agendadas</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.agendadas}</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Calendar size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Em Andamento</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.emAndamento}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Clock size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Concluídas</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.concluidas}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por OS, cliente, técnico, problema..."
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
              <option value="aberta">Aberta</option>
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_material">Aguardando Material</option>
              <option value="concluida">Concluída</option>
            </select>

            <button
              onClick={() => {
                setOsParaEditar(null);
                setModalFormAberto(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
            >
              <Plus size={18} />
              Nova Ordem de Serviço
            </button>
          </div>
        </div>

        {/* TABELA DE OS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner size="md" text="Carregando ordens de serviço..." />
              </div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Wrench className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
                <p className="font-medium text-base">Nenhuma OS encontrada</p>
                <p className="text-xs text-slate-400 mt-1">Abra uma nova Ordem de Serviço para agendar atendimentos e manutenções.</p>
              </div>
            ) : (
              <table className="min-w-[820px] w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">OS / Data</th>
                    <th className="px-5 py-3.5">Cliente & Local</th>
                    <th className="px-5 py-3.5">Técnico</th>
                    <th className="px-5 py-3.5">Serviço / Problema</th>
                    <th className="px-5 py-3.5">Materiais</th>
                    <th className="px-5 py-3.5">Valor Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                  {ordensFiltradas.map((os) => {
                    const statusCfg = STATUS_OS[os.status] || STATUS_OS.aberta;
                    const materiaisCount = (os.materiaisUtilizados || []).length;

                    return (
                      <tr key={os.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            #{os.codigoOS || '00000'}
                          </span>
                          <p className="text-xs text-slate-400">{os.dataAgendamento || os.dataAbertura || '-'}</p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{os.clienteNome || 'Cliente'}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{os.localInstalacao || os.clienteEndereco || '-'}</p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                            {os.tecnicoNome || 'A definir'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{os.tipoServico}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{os.descricaoProblema || '-'}</p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {materiaisCount > 0 ? `${materiaisCount} itens` : 'Nenhum'}
                          </span>
                          {os.estoqueBaixado && (
                            <span className="block text-[10px] text-emerald-600 font-semibold">Baixa efetuada</span>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            R$ {formatCurrency(os.valorTotal || 0)}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 space-y-0.5">
                            <p>Equip: R$ {formatCurrency(os.valorMateriais || 0)}</p>
                            <p>Serv: R$ {formatCurrency(os.valorMaoDeObra || 0)}</p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Baixar PDF da OS */}
                            <button
                              onClick={() => handleBaixarPdf(os)}
                              disabled={gerandoPdfId === os.id}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                              title="Baixar Ordem de Serviço em PDF"
                            >
                              <Download size={16} />
                            </button>

                            {/* Botão Concluir OS (se não estiver concluída) */}
                            {os.status !== 'concluida' && (
                              <button
                                onClick={() => handleAbrirConclusao(os)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                                title="Concluir OS, baixar estoque e faturar"
                              >
                                <Check size={14} />
                                Concluir
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setOsParaEditar(os);
                                setModalFormAberto(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                              title="Editar OS"
                            >
                              <Edit size={16} />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => setOsParaExcluir(os)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                              title="Excluir OS"
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
        </div>

        {/* MODAL FORMULÁRIO DE OS */}
        <Modal
          isOpen={modalFormAberto}
          onClose={() => {
            setModalFormAberto(false);
            setOsParaEditar(null);
          }}
          title={osParaEditar ? `Editar OS #${osParaEditar.codigoOS}` : 'Nova Ordem de Serviço'}
          size="xl"
        >
          <OrdemServicoForm
            initialData={osParaEditar}
            onSubmit={handleSalvarOS}
            onCancel={() => {
              setModalFormAberto(false);
              setOsParaEditar(null);
            }}
          />
        </Modal>

        {/* MODAL DE CONCLUSÃO COM BAIXA ATÔMICA */}
        <Modal
          isOpen={!!osParaConcluir}
          onClose={() => setOsParaConcluir(null)}
          title={`Finalizar e Concluir OS #${osParaConcluir?.codigoOS}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-1">Atenção para as operações automáticas:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Os {(osParaConcluir?.materiaisUtilizados || []).length} materiais registrados sofrerão baixa imediata no estoque.</li>
                <li>Equipamentos com número de série serão vinculados ao histórico do cliente.</li>
                <li>Será gerado o contas a receber no valor de <strong>R$ {formatCurrency(osParaConcluir?.valorTotal || 0)}</strong>.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Solução Realizada / Laudo Técnico Final
              </label>
              <textarea
                rows={3}
                value={solucaoConclusao}
                onChange={(e) => setSolucaoConclusao(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Forma de Recebimento
                </label>
                <select
                  value={formaPagamentoConclusao}
                  onChange={(e) => setFormaPagamentoConclusao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto / Faturado</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={pagoAgora}
                    onChange={(e) => setPagoAgora(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Pagamento já recebido
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setOsParaConcluir(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processandoConclusao}
                onClick={handleConfirmarConclusao}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {processandoConclusao ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processando Baixa...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirmar e Baixar Estoque
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL EXCLUSÃO */}
        <Modal
          isOpen={!!osParaExcluir}
          onClose={() => setOsParaExcluir(null)}
          title="Excluir Ordem de Serviço"
        >
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              Tem certeza que deseja excluir a Ordem de Serviço <strong>#{osParaExcluir?.codigoOS}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setOsParaExcluir(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
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
