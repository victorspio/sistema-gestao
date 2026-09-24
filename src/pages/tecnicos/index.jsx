import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Edit, Trash2, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import PageLayout from '../../components/layout-new/PageLayout';
import Modal from '../../components/modals/Modal';
import { useTecnicos } from '../../hooks/useTecnicos';
import { LoadingSpinner } from '../../components/ui/LoadingComponents';

export default function TecnicosPage() {
  const { tecnicos, loading, error, listarTecnicos, adicionarTecnico, atualizarTecnico, deletarTecnico } = useTecnicos();
  const [modalAberto, setModalAberto] = useState(false);
  const [tecnicoEditar, setTecnicoEditar] = useState(null);
  const [tecnicoExcluir, setTecnicoExcluir] = useState(null);

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [especialidade, setEspecialidade] = useState('CFTV e Alarmes');
  const [status, setStatus] = useState('ativo');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    listarTecnicos();
  }, [listarTecnicos]);

  const handleAbrirNovo = () => {
    setTecnicoEditar(null);
    setNome('');
    setTelefone('');
    setWhatsapp('');
    setEmail('');
    setEspecialidade('CFTV e Alarmes');
    setStatus('ativo');
    setObservacoes('');
    setModalAberto(true);
  };

  const handleAbrirEditar = (tec) => {
    setTecnicoEditar(tec);
    setNome(tec.nome || '');
    setTelefone(tec.telefone || '');
    setWhatsapp(tec.whatsapp || '');
    setEmail(tec.email || '');
    setEspecialidade(tec.especialidade || 'CFTV e Alarmes');
    setStatus(tec.status || 'ativo');
    setObservacoes(tec.observacoes || '');
    setModalAberto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { nome, telefone, whatsapp, email, especialidade, status, observacoes };
      if (tecnicoEditar) {
        await atualizarTecnico(tecnicoEditar.id, payload);
      } else {
        await adicionarTecnico(payload);
      }
      setModalAberto(false);
    } catch (err) {
      alert('Erro ao salvar técnico: ' + err.message);
    }
  };

  const handleExcluir = async () => {
    if (!tecnicoExcluir) return;
    try {
      await deletarTecnico(tecnicoExcluir.id);
      setTecnicoExcluir(null);
    } catch (err) {
      alert('Erro ao excluir técnico: ' + err.message);
    }
  };

  return (
    <PageLayout title="Equipe Técnica">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">Técnicos & Instaladores</h2>
            <p className="text-xs text-slate-500">Profissionais responsáveis pelas Ordens de Serviço e atendimentos de campo.</p>
          </div>
          <button
            onClick={handleAbrirNovo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap"
          >
            <Plus size={18} />
            Novo Técnico
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="md" text="Carregando equipe técnica..." />
          </div>
        ) : tecnicos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-500">
            <Wrench className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={48} />
            <p className="font-medium text-base">Nenhum técnico cadastrado</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre seus instaladores para vinculá-los às Ordens de Serviço.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tecnicos.map((tec) => (
              <div
                key={tec.id}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{tec.nome}</h3>
                      <span className="inline-block mt-1 text-xs px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-medium rounded-full">
                        {tec.especialidade}
                      </span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      tec.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tec.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {tec.telefone || 'Telefone não informado'}
                      {tec.whatsapp && <span className="text-emerald-600 font-medium">(Zap: {tec.whatsapp})</span>}
                    </p>
                    {tec.email && (
                      <p className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        {tec.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => handleAbrirEditar(tec)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setTecnicoExcluir(tec)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL FORMULÁRIO */}
        <Modal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          title={tecnicoEditar ? 'Editar Técnico' : 'Novo Técnico'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone Principal</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Especialidade</label>
                <input
                  type="text"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  placeholder="Ex: CFTV IP, Alarmes, Cercas"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tecnico@seguranca.com.br"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow-md"
              >
                {tecnicoEditar ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL EXCLUSÃO */}
        <Modal
          isOpen={!!tecnicoExcluir}
          onClose={() => setTecnicoExcluir(null)}
          title="Excluir Técnico"
        >
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm">
              Tem certeza que deseja excluir o técnico <strong>{tecnicoExcluir?.nome}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTecnicoExcluir(null)}
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
