import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  X,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

// Mapeamento de status para cor das bolinhas no calendário
const getStatusDotColor = (status) => {
  switch (status) {
    case 'aberta':
      return 'bg-sky-500 dark:bg-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.5)] dark:shadow-[0_0_8px_rgba(56,189,248,0.6)]';
    case 'em_andamento':
      return 'bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)] dark:shadow-[0_0_8px_rgba(251,191,36,0.6)]';
    case 'concluida':
    case 'cancelada':
      return 'bg-slate-400 dark:bg-slate-400';
    case 'agendada':
    case 'aguardando_material':
    default:
      return 'bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)] dark:shadow-[0_0_8px_rgba(129,140,248,0.6)]';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'aberta':
      return { 
        label: 'Aberta', 
        bg: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30' 
      };
    case 'em_andamento':
      return { 
        label: 'Em Andamento', 
        bg: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' 
      };
    case 'concluida':
      return { 
        label: 'Concluída', 
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' 
      };
    case 'cancelada':
      return { 
        label: 'Cancelada', 
        bg: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' 
      };
    case 'agendada':
      return { 
        label: 'Agendada', 
        bg: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' 
      };
    case 'aguardando_material':
      return { 
        label: 'Aguard. Material', 
        bg: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30' 
      };
    default:
      return { 
        label: status || 'Pendente', 
        bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' 
      };
  }
};

export default function AgendaOS({ ordensServico = [] }) {
  const hoje = new Date();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [mostrarPendentesAnteriores, setMostrarPendentesAnteriores] = useState(false);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth(); // 0 a 11

  // Navegação de mês
  const irMesAnterior = () => {
    setDataAtual(new Date(ano, mes - 1, 1));
    setDiaSelecionado(null);
  };

  const irProximoMes = () => {
    setDataAtual(new Date(ano, mes + 1, 1));
    setDiaSelecionado(null);
  };

  const irHoje = () => {
    setDataAtual(new Date());
    setDiaSelecionado(hoje.getDate());
  };

  // Nome do mês formatado em Português
  const nomeMesAno = useMemo(() => {
    const formatador = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
    const str = formatador.format(dataAtual);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [dataAtual]);

  // Função auxiliar para normalizar e extrair YYYY-MM-DD
  const extrairDataString = (os) => {
    const raw = os.dataAgendamento || os.dataAbertura || '';
    if (!raw) return null;
    const clean = raw.split(' ')[0].split('T')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return null;
  };

  // Mapear OS do mês por dia: { [dia]: [os1, os2] }
  const osPorDia = useMemo(() => {
    const mapa = {};
    const mesFormatado = String(mes + 1).padStart(2, '0');
    const prefixoMes = `${ano}-${mesFormatado}`;

    ordensServico.forEach(os => {
      const dataStr = extrairDataString(os);
      if (dataStr && dataStr.startsWith(prefixoMes)) {
        const diaNum = parseInt(dataStr.split('-')[2], 10);
        if (!mapa[diaNum]) mapa[diaNum] = [];
        mapa[diaNum].push(os);
      }
    });

    return mapa;
  }, [ordensServico, ano, mes]);

  // OS pendentes de meses anteriores (não concluídas/canceladas anteriores ao 1º dia do mês visualizado)
  const osPendentesAnteriores = useMemo(() => {
    const primeiroDiaMesStr = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;

    return ordensServico.filter(os => {
      if (os.status === 'concluida' || os.status === 'cancelada') return false;
      const dataStr = extrairDataString(os);
      if (!dataStr) return false;
      return dataStr < primeiroDiaMesStr;
    });
  }, [ordensServico, ano, mes]);

  // Estrutura do calendário: dias vazios antes do dia 1 e total de dias do mês
  const diasDoMes = useMemo(() => {
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo, 6 = Sábado
    const ultimoDia = new Date(ano, mes + 1, 0).getDate(); // Total de dias no mês (28-31)
    
    // Slots vazios anteriores
    const vaziosInicio = Array.from({ length: primeiroDiaSemana }, (_, i) => i);
    // Dias do mês
    const dias = Array.from({ length: ultimoDia }, (_, i) => i + 1);
    
    // Slots vazios no final para fechar a grade (linhas de 7)
    const totalSlots = vaziosInicio.length + dias.length;
    const sobra = totalSlots % 7;
    const vaziosFim = sobra > 0 ? Array.from({ length: 7 - sobra }, (_, i) => i) : [];

    return { vaziosInicio, dias, vaziosFim };
  }, [ano, mes]);

  // Verificar se um dia é hoje
  const eHoje = (dia) => {
    return (
      hoje.getDate() === dia &&
      hoje.getMonth() === mes &&
      hoje.getFullYear() === ano
    );
  };

  // Ordens do dia selecionado
  const osDoDiaSelecionado = diaSelecionado ? (osPorDia[diaSelecionado] || []) : [];

  return (
    <div className="bg-white dark:bg-[#0c1427] text-slate-800 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl p-5 sm:p-7 transition-colors">
      {/* CABEÇALHO DA AGENDA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800/80">
        {/* Lado Esquerdo: Ícone + Título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 dark:bg-indigo-950/70 border border-sky-200 dark:border-indigo-500/30 flex items-center justify-center text-[#00a3d1] dark:text-[#00c8ff] shadow-inner flex-shrink-0">
            <CalendarIcon size={22} className="text-[#00a3d1] dark:text-[#00c8ff]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Agenda das OS
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Clique no dia para ver as OS. Troque o mês sem recarregar.
            </p>
          </div>
        </div>

        {/* Lado Direito: Navegador de Mês + Ver Todas */}
        <div className="flex items-center flex-wrap gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Navegador de Mês */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-1.5 py-1 shadow-sm flex-1 sm:flex-none justify-between">
            <button
              onClick={irMesAnterior}
              title="Mês anterior"
              className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white px-2 sm:px-3 min-w-[110px] sm:min-w-[140px] text-center select-none truncate">
              {nomeMesAno}
            </span>
            <button
              onClick={irProximoMes}
              title="Próximo mês"
              className="p-1 sm:p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão Hoje (se não estiver visualizando o mês atual) */}
            {(hoje.getMonth() !== mes || hoje.getFullYear() !== ano) && (
              <button
                onClick={irHoje}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors font-medium"
              >
                Hoje
              </button>
            )}

            {/* Botão Ver Todas */}
            <Link
              to="/ordens-servico"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Ver todas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DIAS DA SEMANA */}
      <div className="grid grid-cols-7 gap-1 sm:gap-3 text-center my-3 sm:my-4">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((d) => (
          <div
            key={d}
            className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider py-0.5 sm:py-1 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* GRADE DO CALENDÁRIO */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
        {/* Espaços vazios no início */}
        {diasDoMes.vaziosInicio.map((v) => (
          <div
            key={`v-ini-${v}`}
            className="min-h-[50px] sm:min-h-[76px] rounded-xl sm:rounded-2xl bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/40 opacity-40 select-none"
          />
        ))}

        {/* Dias do mês */}
        {diasDoMes.dias.map((dia) => {
          const ordensDoDia = osPorDia[dia] || [];
          const qtdOrdens = ordensDoDia.length;
          const hojeFlag = eHoje(dia);
          const selecionado = diaSelecionado === dia;

          return (
            <div
              key={dia}
              onClick={() => setDiaSelecionado(dia === diaSelecionado ? null : dia)}
              className={`
                group relative min-h-[50px] sm:min-h-[76px] p-1 sm:p-2 rounded-xl sm:rounded-2xl flex flex-col justify-between items-center transition-all cursor-pointer select-none
                ${hojeFlag 
                  ? 'border-2 border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm shadow-indigo-200/50 dark:shadow-indigo-500/10' 
                  : selecionado
                  ? 'ring-2 ring-[#00a3d1] dark:ring-[#00c8ff] bg-sky-50 dark:bg-slate-800/90 border border-[#00a3d1] dark:border-[#00c8ff]/50'
                  : 'bg-slate-50/90 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              {/* Badge com o número do dia */}
              <div className="w-full flex items-center justify-center">
                <span
                  className={`
                    w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold transition-transform group-hover:scale-105
                    ${hojeFlag 
                      ? 'bg-indigo-600 text-white font-bold shadow' 
                      : selecionado
                      ? 'bg-[#00a3d1] dark:bg-[#00c8ff] text-white dark:text-slate-950 font-bold'
                      : 'bg-slate-200/90 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200'
                    }
                  `}
                >
                  {dia}
                </span>
              </div>

              {/* Bolinhas indicadoras das OS */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap w-full py-1">
                {ordensDoDia.slice(0, 3).map((os, idx) => (
                  <span
                    key={os.id || idx}
                    title={`${os.codigoOS ? '#' + os.codigoOS : 'OS'} - ${os.clienteNome || 'Cliente'} (${os.status})`}
                    className={`w-2 h-2 rounded-full ${getStatusDotColor(os.status)}`}
                  />
                ))}
                {qtdOrdens > 3 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +{qtdOrdens - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Espaços vazios no final */}
        {diasDoMes.vaziosFim.map((v) => (
          <div
            key={`v-fim-${v}`}
            className="min-h-[64px] sm:min-h-[82px] rounded-2xl bg-slate-100/50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-slate-800/40 opacity-40 select-none"
          />
        ))}
      </div>

      {/* LEGENDA */}
      <div className="flex items-center justify-center flex-wrap gap-5 sm:gap-8 text-xs text-slate-600 dark:text-slate-400 py-4 mt-5 border-t border-slate-200 dark:border-slate-800/80">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 dark:bg-sky-400 shadow-[0_0_6px_rgba(14,165,233,0.5)] dark:shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
          <span>Aberta</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)] dark:shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
          <span>Em andamento</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>Encerrada</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)] dark:shadow-[0_0_6px_rgba(129,140,248,0.6)]" />
          <span>Outros</span>
        </span>
      </div>

      {/* DETALHES DO DIA SELECIONADO (EXPANSÍVEL) */}
      {diaSelecionado !== null && (
        <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#162035] border border-sky-300 dark:border-[#00c8ff]/30 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-[#00a3d1] dark:text-[#00c8ff]" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Ordens de Serviço do dia {String(diaSelecionado).padStart(2, '0')}/{String(mes + 1).padStart(2, '0')}/{ano}
              </h4>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-[#00c8ff]/20 dark:text-[#00c8ff]">
                {osDoDiaSelecionado.length} {osDoDiaSelecionado.length === 1 ? 'OS' : 'OSs'}
              </span>
            </div>
            <button
              onClick={() => setDiaSelecionado(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Fechar detalhes"
            >
              <X size={16} />
            </button>
          </div>

          {osDoDiaSelecionado.length === 0 ? (
            <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
              Nenhuma Ordem de Serviço agendada para este dia.
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {osDoDiaSelecionado.map((os) => {
                const badge = getStatusBadge(os.status);
                return (
                  <div
                    key={os.id}
                    className="p-3.5 bg-white dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#00a3d1] dark:text-[#00c8ff]">
                          #{os.codigoOS || 'S/N'}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {os.clienteNome || 'Cliente não identificado'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {os.tipoServico || 'Serviço'} &bull; {os.descricaoProblema || 'Sem descrição'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          Técnico: <strong className="text-slate-700 dark:text-slate-200">{os.tecnicoNome || 'A definir'}</strong>
                        </span>
                        {os.dataAgendamento && (
                          <span>Horário/Data: {os.dataAgendamento}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/50">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        R$ {formatCurrency(os.valorTotal || 0)}
                      </span>
                      <Link
                        to="/ordens-servico"
                        className="px-3 py-1.5 bg-sky-50 dark:bg-[#00c8ff]/10 hover:bg-sky-100 dark:hover:bg-[#00c8ff]/20 text-[#00a3d1] dark:text-[#00c8ff] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Abrir</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ALERTA DE OS PENDENTES DE MESES ANTERIORES */}
      {osPendentesAnteriores.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-[#171410] transition-colors">
          <button
            onClick={() => setMostrarPendentesAnteriores(!mostrarPendentesAnteriores)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-amber-100/60 dark:hover:bg-amber-950/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-400">
                {osPendentesAnteriores.length} OS {osPendentesAnteriores.length === 1 ? 'pendente' : 'pendentes'} de meses anteriores
              </span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white dark:text-slate-950 font-bold text-[11px] flex items-center justify-center">
                {osPendentesAnteriores.length}
              </span>
            </div>
            <div className="text-amber-600 dark:text-amber-400 p-1">
              {mostrarPendentesAnteriores ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {mostrarPendentesAnteriores && (
            <div className="p-4 pt-0 space-y-2 border-t border-amber-200 dark:border-amber-900/40">
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mb-2">
                Estas ordens de serviço foram abertas ou agendadas antes deste mês e continuam em aberto:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {osPendentesAnteriores.map((os) => {
                  const badge = getStatusBadge(os.status);
                  return (
                    <div
                      key={os.id}
                      className="p-3 bg-white dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600 dark:text-amber-400">#{os.codigoOS}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{os.clienteNome}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Data: {os.dataAgendamento || os.dataAbertura || 'Sem data'} &bull; Técnico: {os.tecnicoNome || 'A definir'}
                        </p>
                      </div>
                      <Link
                        to="/ordens-servico"
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                      >
                        Ver OS
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
