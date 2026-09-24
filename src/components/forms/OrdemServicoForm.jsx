import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, User, Wrench, Package, Calendar, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useClientes } from '../../hooks/useClientes';
import { useTecnicos } from '../../hooks/useTecnicos';
import { useEstoque } from '../../hooks/useEstoque';
import { formatCurrency } from '../../utils/formatters';

const TIPOS_SERVICO = [
  'Instalação de Sistema Novo',
  'Manutenção Corretiva',
  'Manutenção Preventiva',
  'Alinhamento e Troca de Câmera',
  'Configuração de Rede e Acesso Remoto',
  'Troca de Bateria / Nobreak',
  'Reparo de Fechadura / Eletroímã',
  'Chamado Emergencial'
];

export default function OrdemServicoForm({ onSubmit, initialData, onCancel }) {
  const { clientes, listarClientes } = useClientes();
  const { tecnicos, listarTecnicos } = useTecnicos();
  const { produtos, listarProdutos } = useEstoque();

  const [clienteId, setClienteId] = useState(initialData?.clienteId || '');
  const [tecnicoId, setTecnicoId] = useState(initialData?.tecnicoId || '');
  const [tipoServico, setTipoServico] = useState(initialData?.tipoServico || 'Instalação de Sistema Novo');
  const [dataAgendamento, setDataAgendamento] = useState(initialData?.dataAgendamento || new Date().toISOString().split('T')[0]);
  const [descricaoProblema, setDescricaoProblema] = useState(initialData?.descricaoProblema || '');
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState(initialData?.diagnosticoTecnico || '');
  const [solucaoRealizada, setSolucaoRealizada] = useState(initialData?.solucaoRealizada || '');
  const [status, setStatus] = useState(initialData?.status || 'aberta');
  const [valorMaoDeObra, setValorMaoDeObra] = useState(initialData?.valorMaoDeObra || 150);
  const [localInstalacao, setLocalInstalacao] = useState(initialData?.localInstalacao || '');

  // Materiais utilizados na OS
  const [materiais, setMateriais] = useState(initialData?.materiaisUtilizados || []);

  useEffect(() => {
    listarClientes();
    listarTecnicos();
    listarProdutos();
  }, []);

  const clienteSelecionado = useMemo(() => {
    return clientes.find(c => c.id === clienteId) || null;
  }, [clienteId, clientes]);

  const tecnicoSelecionado = useMemo(() => {
    return tecnicos.find(t => t.id === tecnicoId) || null;
  }, [tecnicoId, tecnicos]);

  const handleAddMaterial = () => {
    setMateriais(prev => [
      ...prev,
      {
        id: 'mat_' + Date.now(),
        produtoId: '',
        nome: '',
        marca: '',
        modelo: '',
        quantidade: 1,
        unidade: 'un',
        valorUnitario: 0,
        instalarNoCliente: false,
        numeroSerie: ''
      }
    ]);
  };

  const handleProdutoSelect = (index, prodId) => {
    const p = produtos.find(item => item.id === prodId);
    if (!p) return;

    setMateriais(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        produtoId: p.id,
        nome: p.nome,
        marca: p.marca || '',
        modelo: p.modelo || '',
        unidade: p.unidade || 'un',
        valorUnitario: parseFloat(p.precoVenda) || 0
      };
      return copy;
    });
  };

  const handleMaterialField = (index, field, value) => {
    setMateriais(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveMaterial = (index) => {
    setMateriais(prev => prev.filter((_, i) => i !== index));
  };

  const valorMateriais = useMemo(() => {
    return materiais.reduce((acc, m) => {
      return acc + ((parseFloat(m.quantidade) || 0) * (parseFloat(m.valorUnitario) || 0));
    }, 0);
  }, [materiais]);

  const totalOS = useMemo(() => {
    return (parseFloat(valorMaoDeObra) || 0) + valorMateriais;
  }, [valorMaoDeObra, valorMateriais]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clienteId) {
      alert('Selecione o cliente para a Ordem de Serviço.');
      return;
    }

    const payload = {
      clienteId,
      clienteNome: clienteSelecionado?.nome || '',
      clienteTelefone: clienteSelecionado?.telefone || '',
      clienteWhatsapp: clienteSelecionado?.whatsapp || '',
      clienteEndereco: clienteSelecionado?.endereco || '',
      clienteBairro: clienteSelecionado?.bairro || '',
      clienteCidade: clienteSelecionado?.cidade || '',
      localInstalacao: localInstalacao || clienteSelecionado?.endereco || '',
      tecnicoId,
      tecnicoNome: tecnicoSelecionado?.nome || 'A definir',
      tipoServico,
      dataAgendamento,
      descricaoProblema,
      diagnosticoTecnico,
      solucaoRealizada,
      materiaisUtilizados: materiais.map(m => ({
        produtoId: m.produtoId,
        nome: m.nome,
        marca: m.marca || '',
        modelo: m.modelo || '',
        quantidade: parseFloat(m.quantidade) || 1,
        unidade: m.unidade || 'un',
        valorUnitario: parseFloat(m.valorUnitario) || 0,
        subtotal: (parseFloat(m.quantidade) || 1) * (parseFloat(m.valorUnitario) || 0),
        instalarNoCliente: !!m.instalarNoCliente,
        numeroSerie: m.numeroSerie || ''
      })),
      valorMateriais,
      valorMaoDeObra: parseFloat(valorMaoDeObra) || 0,
      valorTotal: totalOS,
      status
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CLIENTE E TÉCNICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User size={16} className="text-orange-500" />
            Cliente *
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          >
            <option value="">-- Selecione o Cliente --</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.nome} {cli.telefone ? `(${cli.telefone})` : ''} - {cli.cidade || ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Wrench size={16} className="text-orange-500" />
            Técnico Responsável
          </label>
          <select
            value={tecnicoId}
            onChange={(e) => setTecnicoId(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          >
            <option value="">-- Selecione o Técnico (ou definir depois) --</option>
            {tecnicos.map(tec => (
              <option key={tec.id} value={tec.id}>
                {tec.nome} ({tec.especialidade || 'CFTV'})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Local de Atendimento / Instalação
          </label>
          <input
            type="text"
            value={localInstalacao}
            onChange={(e) => setLocalInstalacao(e.target.value)}
            placeholder={clienteSelecionado ? `${clienteSelecionado.endereco || ''}, ${clienteSelecionado.bairro || ''} - ${clienteSelecionado.cidade || ''}` : 'Endereço da instalação'}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* TIPO DE SERVIÇO, AGENDAMENTO E STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tipo de Atendimento
          </label>
          <select
            value={tipoServico}
            onChange={(e) => setTipoServico(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          >
            {TIPOS_SERVICO.map((tipo, idx) => (
              <option key={idx} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Data Agendada
          </label>
          <input
            type="date"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Status da OS
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          >
            <option value="aberta">Aberta</option>
            <option value="agendada">Agendada</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="aguardando_material">Aguardando Material</option>
            <option value="concluida">Concluída (Pronta para Baixa)</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* DETALHES DO CHAMADO */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Serviço Solicitado / Descrição do Problema *
          </label>
          <textarea
            rows={2}
            required
            value={descricaoProblema}
            onChange={(e) => setDescricaoProblema(e.target.value)}
            placeholder="Ex: Câmera do portão de veículos sem imagem. Cliente relata tela preta no aplicativo..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Diagnóstico do Técnico (opcional ao abrir)
            </label>
            <textarea
              rows={2}
              value={diagnosticoTecnico}
              onChange={(e) => setDiagnosticoTecnico(e.target.value)}
              placeholder="Ex: Fonte da câmera queimada por oscilação de energia..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Solução Realizada (na conclusão)
            </label>
            <textarea
              rows={2}
              value={solucaoRealizada}
              onChange={(e) => setSolucaoRealizada(e.target.value)}
              placeholder="Ex: Substituição da fonte 12V 2A e troca do conector P4. Testado sinal com sucesso."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* MATERIAIS UTILIZADOS NA OS (BAIXA AUTOMÁTICA) */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Package size={17} className="text-orange-500" />
              Materiais Utilizados na OS ({materiais.length})
            </h3>
            <p className="text-[11px] text-slate-500">Ao concluir a OS, o sistema dará baixa automática no estoque.</p>
          </div>
          <button
            type="button"
            onClick={handleAddMaterial}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm"
          >
            <Plus size={15} />
            Adicionar Material
          </button>
        </div>

        {materiais.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            Nenhum material registrado para esta OS.
          </div>
        ) : (
          <div className="space-y-2">
            {materiais.map((mat, idx) => (
              <div
                key={mat.id || idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6">
                    <label className="block text-[11px] text-slate-500 mb-1">Produto do Estoque</label>
                    <select
                      value={mat.produtoId}
                      onChange={(e) => handleProdutoSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    >
                      <option value="">-- Selecione o Produto do Estoque --</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Saldo: {p.quantidade} {p.unidade}) - R$ {formatCurrency(p.precoVenda || 0)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Qtd Utilizada</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={mat.quantidade}
                      onChange={(e) => handleMaterialField(idx, 'quantidade', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">Valor Cobrado (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mat.valorUnitario}
                      onChange={(e) => handleMaterialField(idx, 'valorUnitario', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-right"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center pt-3 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Opção de vincular como equipamento instalado com garantia */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={mat.instalarNoCliente}
                      onChange={(e) => handleMaterialField(idx, 'instalarNoCliente', e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    Registrar nos Equipamentos Instalados do Cliente (com garantia)
                  </label>

                  {mat.instalarNoCliente && (
                    <input
                      type="text"
                      placeholder="Nº de Série / MAC (opcional)"
                      value={mat.numeroSerie || ''}
                      onChange={(e) => handleMaterialField(idx, 'numeroSerie', e.target.value)}
                      className="px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg w-48"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VALORES E TOTAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl items-center">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Valor da Mão de Obra / Serviço (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={valorMaoDeObra}
            onChange={(e) => setValorMaoDeObra(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p>Subtotal Equipamentos: <strong>R$ {formatCurrency(valorMateriais)}</strong></p>
          <p>Subtotal Serviços: <strong>R$ {formatCurrency(parseFloat(valorMaoDeObra) || 0)}</strong></p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total da OS</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            R$ {formatCurrency(totalOS)}
          </p>
        </div>
      </div>

      {/* BOTÕES */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
        >
          {initialData ? 'Atualizar OS' : 'Criar Ordem de Serviço'}
        </button>
      </div>
    </form>
  );
}
