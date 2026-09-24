import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import PageLayout from '../../components/layout-new/PageLayout';
import { useOrcamentos } from '../../hooks/useOrcamentos';
import { useOrdensServico } from '../../hooks/useOrdensServico';
import { useEquipamentos } from '../../hooks/useEquipamentos';
import { useEstoque } from '../../hooks/useEstoque';
import { useClientes } from '../../hooks/useClientes';
import { useFinanceiro } from '../../hooks/useFinanceiro';
import { formatCurrency } from '../../utils/formatters';
import AgendaOS from '../../components/dashboard/AgendaOS';

export default function DashboardPage() {
  const { orcamentos, listarOrcamentos } = useOrcamentos();
  const { ordensServico, listarOrdensServico } = useOrdensServico();
  const { equipamentos, listarEquipamentos } = useEquipamentos();
  const { produtos, listarProdutos } = useEstoque();
  const { clientes, listarClientes } = useClientes();
  const { contasReceber, listarContasReceber } = useFinanceiro();

  useEffect(() => {
    listarOrcamentos();
    listarOrdensServico();
    listarEquipamentos();
    listarProdutos();
    listarClientes();
    listarContasReceber();
  }, []);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const orcAbertos = orcamentos.filter(o => o.status === 'aguardando' || o.status === 'enviado');
    const valorOrcAbertos = orcAbertos.reduce((acc, o) => acc + (parseFloat(o.valorTotal) || 0), 0);

    const osEmAberto = ordensServico.filter(o => o.status === 'aberta' || o.status === 'agendada' || o.status === 'em_andamento');
    const osHoje = ordensServico.filter(o => {
      const hoje = new Date().toISOString().split('T')[0];
      return (o.dataAgendamento === hoje || o.dataAbertura === hoje) && o.status !== 'concluida';
    });

    const hojeStr = new Date().toISOString().split('T')[0];
    const emGarantia = equipamentos.filter(e => e.dataGarantiaAte && e.dataGarantiaAte >= hojeStr).length;

    const estoqueBaixo = produtos.filter(p => p.quantidade <= (p.estoqueMinimo || 5));

    const totalReceber = (contasReceber || [])
      .filter(c => c.status === 'pendente')
      .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

    return {
      orcAbertosQtd: orcAbertos.length,
      valorOrcAbertos,
      osEmAbertoQtd: osEmAberto.length,
      osHojeQtd: osHoje.length,
      emGarantiaQtd: emGarantia,
      estoqueBaixoQtd: estoqueBaixo.length,
      estoqueBaixoItens: estoqueBaixo.slice(0, 5),
      totalReceber,
      totalClientes: clientes.length,
      proximasOS: osEmAberto.slice(0, 5),
      ultimosOrcamentos: orcamentos.slice(0, 5)
    };
  }, [orcamentos, ordensServico, equipamentos, produtos, clientes, contasReceber]);

  return (
    <PageLayout title="Painel de Controle - Zeu-Tech">
      <div className="space-y-8">
        {/* BOAS-VINDAS E ATALHOS RÁPIDOS */}
        <div className="bg-gradient-to-r from-[#060d30] via-[#0057b8] to-[#00c8ff] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-[#00c8ff]/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
                Gestão Operacional & Comercial
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-3">
                Zeu-Tech
              </h2>
              <p className="text-white/90 text-sm mt-1 max-w-xl">
                Controle integral de orçamentos, ordens de serviço, técnicos de campo, equipamentos instalados e faturamento.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/orcamentos"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0057b8] hover:bg-[#00c8ff]/10 font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                <PlusCircle size={16} />
                Novo Orçamento
              </Link>
              <Link
                to="/ordens-servico"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
              >
                <Wrench size={16} />
                Nova OS
              </Link>
            </div>
          </div>
        </div>

        {/* CARDS DE INDICADORES PRINCIPAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card OS */}
          <Link
            to="/ordens-servico"
            className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">OS em Andamento</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {metricas.osEmAbertoQtd}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Wrench size={22} />
              </div>
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-3 flex items-center gap-1">
              <span>{metricas.osHojeQtd} agendadas para hoje</span>
              <ArrowRight size={14} />
            </p>
          </Link>

          {/* Card Orçamentos */}
          <Link
            to="/orcamentos"
            className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Propostas em Aberto</p>
                <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {metricas.orcAbertosQtd}
                </h3>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileText size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3">
              R$ {formatCurrency(metricas.valorOrcAbertos)} em negociação
            </p>
          </Link>

          {/* Card Equipamentos */}
          <Link
            to="/equipamentos"
            className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sob Garantia Ativa</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {metricas.emGarantiaQtd}
                </h3>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                <ShieldCheck size={22} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-3 flex items-center gap-1">
              <span>{equipamentos.length} equipamentos nos clientes</span>
              <ArrowRight size={14} />
            </p>
          </Link>

          {/* Card Financeiro */}
          <Link
            to="/financeiro"
            className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contas a Receber</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  R$ {formatCurrency(metricas.totalReceber)}
                </h3>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                <DollarSign size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1">
              <span>Ver fluxo financeiro</span>
              <ArrowRight size={14} />
            </p>
          </Link>
        </div>

        {/* AGENDA DAS ORDENS DE SERVIÇO */}
        <AgendaOS ordensServico={ordensServico} />

        {/* GRADES INFERIORES: ORDENS DE SERVIÇO RECENTES & ALERTAS DE ESTOQUE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Próximas OS / Chamados */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-orange-500" />
                  Próximos Atendimentos & Ordens de Serviço
                </h3>
                <p className="text-xs text-slate-500">Chamados técnicos abertos e agendados para a equipe.</p>
              </div>
              <Link to="/ordens-servico" className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                Ver todas ({ordensServico.length})
              </Link>
            </div>

            {metricas.proximasOS.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                Nenhum chamado pendente no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {metricas.proximasOS.map(os => (
                  <div
                    key={os.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-orange-600 dark:text-orange-400">
                          #{os.codigoOS}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white">
                          {os.clienteNome}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                          {os.tipoServico}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                        {os.descricaoProblema || 'Sem descrição'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Técnico: <strong>{os.tecnicoNome || 'A definir'}</strong> | Agendado: {os.dataAgendamento || os.dataAbertura || '-'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        R$ {formatCurrency(os.valorTotal || 0)}
                      </span>
                      <Link
                        to="/ordens-servico"
                        className="block mt-1 text-[11px] text-orange-600 font-medium hover:underline"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alertas de Estoque de Equipamentos */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Alerta de Estoque Baixo
                </h3>
                <p className="text-xs text-slate-500">Equipamentos para compra ou reposição.</p>
              </div>
              <Link to="/estoque" className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                Estoque
              </Link>
            </div>

            {metricas.estoqueBaixoItens.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl text-xs">
                Estoque de equipamentos operando em níveis normais.
              </div>
            ) : (
              <div className="space-y-3">
                {metricas.estoqueBaixoItens.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{p.nome}</p>
                      <p className="text-[11px] text-slate-400">{p.categoria || 'Equipamento'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600">
                        {p.quantidade} {p.unidade || 'un'}
                      </span>
                      <p className="text-[10px] text-slate-400">Mín: {p.estoqueMinimo || 5}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/compras"
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                Registrar Compra com Distribuidor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
