import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  Users,
  Edit, 
  Trash2, 
  History, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Cpu,
  Eye,
  ChevronRight,
  ExternalLink,
  List,
  Layers
} from 'lucide-react';
import PageLayout from '../../components/layout-new/PageLayout';
import Modal from '../../components/modals/Modal';
import { useEquipamentos } from '../../hooks/useEquipamentos';
import { useClientes } from '../../hooks/useClientes';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';

const TIPOS_EQUIPAMENTO = [
  'Câmera Bullet CFTV',
  'Câmera Dome CFTV',
  'Câmera Speed Dome PTZ',
  'Gravador DVR / NVR',
  'Central de Alarme',
  'Central de Choque / Cerca Elétrica',
  'Fechadura Digital / Eletroímã',
  'Sensor de Presença / Barreira',
  'Interfone / Vídeo Porteiro',
  'Nobreak / Fonte Nobreak',
  'Switch PoE / Roteador'
];

export default function EquipamentosPage() {
  const { 
    equipamentos, 
    loading, 
    listarEquipamentos, 
    adicionarEquipamento, 
    atualizarEquipamento, 
    registrarManutencao, 
    deletarEquipamento 
  } = useEquipamentos();

  const { clientes, listarClientes } = useClientes();

  const [busca, setBusca] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [modalManutencaoAberto, setModalManutencaoAberto] = useState(false);
  const [clienteModalId, setClienteModalId] = useState(null);
  const [equipamentoEditar, setEquipamentoEditar] = useState(null);
  const [equipamentoManutencao, setEquipamentoManutencao] = useState(null);
  const [equipamentoExcluir, setEquipamentoExcluir] = useState(null);

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Câmera Bullet CFTV');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [localInstalacao, setLocalInstalacao] = useState('');
  const [dataInstalacao, setDataInstalacao] = useState(new Date().toISOString().split('T')[0]);
  const [dataGarantiaAte, setDataGarantiaAte] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState('ativo');
  const [observacoes, setObservacoes] = useState('');

  // Manutenção Form State
  const [descManutencao, setDescManutencao] = useState('');
  const [tecnicoManutencao, setTecnicoManutencao] = useState('');

  useEffect(() => {
    listarEquipamentos();
    listarClientes();
  }, [listarEquipamentos, listarClientes]);

  // Agrupar equipamentos por cliente
  const clientesComEquipamentos = useMemo(() => {
    const mapa = {};
    const hoje = new Date().toISOString().split('T')[0];

    equipamentos.forEach(eq => {
      const key = eq.clienteId || (eq.clienteNome ? `nome_${eq.clienteNome}` : 'sem_cliente');
      if (!mapa[key]) {
        mapa[key] = {
          id: key,
          clienteId: eq.clienteId || '',
          clienteNome: eq.clienteNome || 'Cliente não informado',
          equipamentos: []
        };
      }
      mapa[key].equipamentos.push(eq);
    });

    const lista = Object.values(mapa);

    return lista.map(c => {
      const total = c.equipamentos.length;
      const emGarantia = c.equipamentos.filter(e => e.dataGarantiaAte && e.dataGarantiaAte >= hoje).length;
      const garantiaExpirada = total - emGarantia;
      const emManutencao = c.equipamentos.filter(e => e.status === 'em_manutencao').length;
      const ativos = c.equipamentos.filter(e => e.status === 'ativo').length;
      
      const clienteCadastrado = clientes.find(cli => cli.id === c.clienteId || cli.nome === c.clienteNome);

      // Encontra a data mais recente de instalação
      const datasInstalacao = c.equipamentos
        .map(e => e.dataInstalacao)
        .filter(Boolean)
        .sort()
        .reverse();

      return {
        ...c,
        total,
        emGarantia,
        garantiaExpirada,
        emManutencao,
        ativos,
        ultimaInstalacao: datasInstalacao[0] || '-',
        telefone: clienteCadastrado?.telefone || clienteCadastrado?.whatsapp || '',
        cidade: clienteCadastrado?.cidade || clienteCadastrado?.endereco || ''
      };
    });
  }, [equipamentos, clientes]);

  // Filtragem dos clientes agrupados
  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return clientesComEquipamentos.filter(c => {
      if (filtroCliente !== 'todos') {
        if (c.clienteId !== filtroCliente && c.id !== filtroCliente) {
          return false;
        }
      }

      if (!termo) return true;

      // Busca pelo nome do cliente ou dados de contato
      const matchCliente = (
        c.clienteNome.toLowerCase().includes(termo) ||
        c.telefone?.toLowerCase().includes(termo) ||
        c.cidade?.toLowerCase().includes(termo)
      );
      if (matchCliente) return true;

      // Busca nos equipamentos deste cliente
      const matchEquipamento = c.equipamentos.some(eq => 
        eq.nome?.toLowerCase().includes(termo) ||
        eq.numeroSerie?.toLowerCase().includes(termo) ||
        eq.marca?.toLowerCase().includes(termo) ||
        eq.modelo?.toLowerCase().includes(termo) ||
        eq.localInstalacao?.toLowerCase().includes(termo) ||
        eq.tipo?.toLowerCase().includes(termo)
      );

      return matchEquipamento;
    });
  }, [clientesComEquipamentos, busca, filtroCliente]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = equipamentos.length;
    const totalClientes = clientesComEquipamentos.length;
    const hoje = new Date().toISOString().split('T')[0];
    const emGarantia = equipamentos.filter(e => e.dataGarantiaAte && e.dataGarantiaAte >= hoje).length;
    const emManutencao = equipamentos.filter(e => e.status === 'em_manutencao').length;

    return { total, totalClientes, emGarantia, emManutencao };
  }, [equipamentos, clientesComEquipamentos]);

  // Cliente atualmente aberto no Modal
  const clienteAtivoModal = useMemo(() => {
    if (!clienteModalId) return null;
    return clientesComEquipamentos.find(c => c.id === clienteModalId) || null;
  }, [clientesComEquipamentos, clienteModalId]);

  const handleAbrirNovo = (idClientePredefinido = '') => {
    setEquipamentoEditar(null);
    setClienteId(idClientePredefinido || '');
    setNome('');
    setTipo('Câmera Bullet CFTV');
    setMarca('Intelbras');
    setModelo('');
    setNumeroSerie('');
    setLocalInstalacao('');
    setDataInstalacao(new Date().toISOString().split('T')[0]);
    setDataGarantiaAte(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setStatus('ativo');
    setObservacoes('');
    setModalFormAberto(true);
  };

  const handleAbrirEditar = (eq) => {
    setEquipamentoEditar(eq);
    setClienteId(eq.clienteId || '');
    setNome(eq.nome || '');
    setTipo(eq.tipo || 'Câmera Bullet CFTV');
    setMarca(eq.marca || '');
    setModelo(eq.modelo || '');
    setNumeroSerie(eq.numeroSerie || '');
    setLocalInstalacao(eq.localInstalacao || '');
    setDataInstalacao(eq.dataInstalacao || new Date().toISOString().split('T')[0]);
    setDataGarantiaAte(eq.dataGarantiaAte || '');
    setStatus(eq.status || 'ativo');
    setObservacoes(eq.observacoes || '');
    setModalFormAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    const cli = clientes.find(c => c.id === clienteId);
    const payload = {
      clienteId,
      clienteNome: cli?.nome || 'Cliente',
      nome,
      tipo,
      marca,
      modelo,
      numeroSerie,
      localInstalacao,
      dataInstalacao,
      dataGarantiaAte,
      status,
      observacoes
    };

    try {
      if (equipamentoEditar) {
        await atualizarEquipamento(equipamentoEditar.id, payload);
      } else {
        await adicionarEquipamento(payload);
      }
      setModalFormAberto(false);
    } catch (err) {
      alert('Erro ao salvar equipamento: ' + err.message);
    }
  };

  const handleAbrirManutencao = (eq) => {
    setEquipamentoManutencao(eq);
    setDescManutencao('');
    setTecnicoManutencao('');
    setModalManutencaoAberto(true);
  };

  const handleSalvarManutencao = async (e) => {
    e.preventDefault();
    if (!descManutencao) return;
    try {
      await registrarManutencao(equipamentoManutencao.id, {
        descricao: descManutencao,
        tecnico: tecnicoManutencao,
        data: new Date().toISOString().split('T')[0]
      });
      setDescManutencao('');
      setTecnicoManutencao('');
      alert('Manutenção registrada com sucesso no histórico do equipamento!');
    } catch (err) {
      alert('Erro ao registrar manutenção: ' + err.message);
    }
  };

  const handleExcluir = async () => {
    if (!equipamentoExcluir) return;
    try {
      await deletarEquipamento(equipamentoExcluir.id);
      setEquipamentoExcluir(null);
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <PageLayout title="Equipamentos Instalados nos Clientes">
      <div className="space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clientes com Equipamentos</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalClientes}</h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Equipamentos</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <Cpu size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Em Garantia Ativa</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.emGarantia}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <Shield size={22} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Em Manutenção</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.emManutencao}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <Wrench size={22} />
            </div>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente, equipamento, serial, marca..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 max-w-xs truncate"
            >
              <option value="todos">Todos os Clientes</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <button
              onClick={() => handleAbrirNovo()}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
            >
              <Plus size={18} />
              Registrar Equipamento
            </button>
          </div>
        </div>

        {/* TABELA AGRUPADA POR CLIENTE */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner size="md" text="Carregando equipamentos instalados..." />
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Cpu className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
                <p className="font-medium text-base">Nenhum equipamento cadastrado</p>
                <p className="text-xs text-slate-400 mt-1">Cadastre novos equipamentos ou vincule aos clientes durante o fechamento de uma OS.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Total Vinculado</th>
                    <th className="px-6 py-4">Garantias</th>
                    <th className="px-6 py-4">Status Operacional</th>
                    <th className="px-6 py-4">Última Instalação</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                  {clientesFiltrados.map((item) => {
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors group cursor-pointer"
                        onClick={() => setClienteModalId(item.id)}
                      >
                        {/* Nome do Cliente */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                              {item.clienteNome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClienteModalId(item.id);
                                }}
                                className="font-bold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 text-left transition-colors flex items-center gap-1.5"
                              >
                                <span>{item.clienteNome}</span>
                                <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 text-orange-500 transition-opacity" />
                              </button>
                              {(item.telefone || item.cidade) && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {item.telefone && <span>{item.telefone}</span>}
                                  {item.telefone && item.cidade && <span> &bull; </span>}
                                  {item.cidade && <span>{item.cidade}</span>}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total Vinculado */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            <Cpu size={14} className="text-slate-500 dark:text-slate-400" />
                            {item.total} {item.total === 1 ? 'equipamento' : 'equipamentos'}
                          </span>
                        </td>

                        {/* Garantias */}
                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-col gap-1 items-start">
                            {item.emGarantia > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <Shield size={12} />
                                {item.emGarantia} sob garantia
                              </span>
                            )}
                            {item.garantiaExpirada > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                                {item.garantiaExpirada} expirada(s)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Operacional */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              {item.ativos} Ativo{item.ativos !== 1 ? 's' : ''}
                            </span>
                            {item.emManutencao > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                {item.emManutencao} em manutenção
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Data de Instalação */}
                        <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                          {item.ultimaInstalacao}
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleAbrirNovo(item.clienteId)}
                              className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                              title="Adicionar Equipamento para este Cliente"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              onClick={() => setClienteModalId(item.id)}
                              className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Eye size={14} />
                              <span>Ver todos ({item.total})</span>
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

        {/* MODAL: VER TODOS OS EQUIPAMENTOS DO CLIENTE */}
        <Modal
          isOpen={!!clienteAtivoModal}
          onClose={() => setClienteModalId(null)}
          title={`Equipamentos Vinculados: ${clienteAtivoModal?.clienteNome}`}
          size="xl"
        >
          {clienteAtivoModal && (
            <div className="space-y-4">
              {/* Barra de Resumo e Ação de Cadastro */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Total:</span>
                    <strong className="ml-1 text-slate-800 dark:text-white font-bold">{clienteAtivoModal.total} itens</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Em garantia:</span>
                    <strong className="ml-1 text-emerald-600 font-bold">{clienteAtivoModal.emGarantia}</strong>
                  </div>
                  {clienteAtivoModal.emManutencao > 0 && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Em manutenção:</span>
                      <strong className="ml-1 text-amber-600 font-bold">{clienteAtivoModal.emManutencao}</strong>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAbrirNovo(clienteAtivoModal.clienteId)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shadow-sm transition-colors"
                >
                  <Plus size={14} />
                  <span>Novo Equipamento</span>
                </button>
              </div>

              {/* Tabela dos Equipamentos desse Cliente */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Equipamento</th>
                      <th className="px-4 py-3">Ponto / Local</th>
                      <th className="px-4 py-3">Marca / Modelo</th>
                      <th className="px-4 py-3">Serial / MAC</th>
                      <th className="px-4 py-3">Garantia</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {clienteAtivoModal.equipamentos.map((eq) => {
                      const hoje = new Date().toISOString().split('T')[0];
                      const emGarantia = eq.dataGarantiaAte && eq.dataGarantiaAte >= hoje;

                      return (
                        <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">{eq.nome}</p>
                            <span className="text-[10px] text-slate-500">{eq.tipo}</span>
                          </td>

                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span>{eq.localInstalacao || 'Não informado'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            <p className="font-medium">{eq.marca || '-'}</p>
                            <p className="text-[10px] text-slate-500">{eq.modelo || '-'}</p>
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                            {eq.numeroSerie || 'Sem serial'}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              emGarantia 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              {emGarantia ? `Até ${eq.dataGarantiaAte}` : 'Expirada'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              eq.status === 'ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                              eq.status === 'em_manutencao' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {eq.status === 'ativo' ? 'Ativo' : eq.status === 'em_manutencao' ? 'Em Manutenção' : 'Substituído'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleAbrirManutencao(eq)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
                                title="Histórico de Manutenções"
                              >
                                <History size={14} />
                              </button>

                              <button
                                onClick={() => handleAbrirEditar(eq)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                                title="Editar Equipamento"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={() => setEquipamentoExcluir(eq)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                title="Excluir Equipamento"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setClienteModalId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL FORMULÁRIO DE EQUIPAMENTO */}
        <Modal
          isOpen={modalFormAberto}
          onClose={() => setModalFormAberto(false)}
          title={equipamentoEditar ? 'Editar Equipamento Instalado' : 'Registrar Equipamento no Cliente'}
          size="lg"
        >
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  <option value="">-- Selecione o Cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Equipamento</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  {TIPOS_EQUIPAMENTO.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome / Descrição do Equipamento *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Câmera IP 2MP Varifocal IR 30m"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Marca</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ex: Intelbras, Hikvision"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ex: VIP 1230 B"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nº de Série / MAC</label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ex: 4A7B8C9D0E1F"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Local / Ponto de Instalação</label>
                <input
                  type="text"
                  value={localInstalacao}
                  onChange={(e) => setLocalInstalacao(e.target.value)}
                  placeholder="Ex: Portão social / Estacionamento"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Instalação</label>
                <input
                  type="date"
                  value={dataInstalacao}
                  onChange={(e) => setDataInstalacao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Garantia Até</label>
                <input
                  type="date"
                  value={dataGarantiaAte}
                  onChange={(e) => setDataGarantiaAte(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalFormAberto(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow-md"
              >
                {equipamentoEditar ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL HISTÓRICO DE MANUTENÇÕES */}
        <Modal
          isOpen={modalManutencaoAberto}
          onClose={() => setModalManutencaoAberto(false)}
          title={`Histórico do Equipamento: ${equipamentoManutencao?.nome}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-xs space-y-1">
              <p><strong>Cliente:</strong> {equipamentoManutencao?.clienteNome} | <strong>Local:</strong> {equipamentoManutencao?.localInstalacao}</p>
              <p><strong>Marca/Modelo:</strong> {equipamentoManutencao?.marca} {equipamentoManutencao?.modelo} | <strong>Serial:</strong> {equipamentoManutencao?.numeroSerie || 'Sem serial'}</p>
            </div>

            {/* Linha do Tempo de Manutenções */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Histórico de Atendimentos</h4>
              {(!equipamentoManutencao?.historicoManutencao || equipamentoManutencao.historicoManutencao.length === 0) ? (
                <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-lg">
                  Nenhuma manutenção registrada até o momento para este equipamento.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {equipamentoManutencao.historicoManutencao.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Data: {m.data}</span>
                        <span>Técnico: {m.tecnico || 'Não informado'}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">{m.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registrar Nova Manutenção */}
            <form onSubmit={handleSalvarManutencao} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Registrar Novo Atendimento / Troca</h4>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Descrição da manutenção (ex: Troca de conector P4 e limpeza da lente)"
                  value={descManutencao}
                  onChange={(e) => setDescManutencao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nome do Técnico"
                  value={tecnicoManutencao}
                  onChange={(e) => setTecnicoManutencao(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* MODAL EXCLUSÃO */}
        <Modal
          isOpen={!!equipamentoExcluir}
          onClose={() => setEquipamentoExcluir(null)}
          title="Excluir Equipamento"
        >
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              Tem certeza que deseja excluir o equipamento <strong>{equipamentoExcluir?.nome}</strong> do cliente <strong>{equipamentoExcluir?.clienteNome}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setEquipamentoExcluir(null)}
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
