import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Shield, Wrench, DollarSign, Calendar, Clock, User, Package } from 'lucide-react';
import { useClientes } from '../../hooks/useClientes';
import { useEstoque } from '../../hooks/useEstoque';
import { formatCurrency } from '../../utils/formatters';

const SERVICOS_SUGERIDOS = [
  'Instalação e alinhamento de câmera CFTV',
  'Instalação e configuração de DVR / NVR',
  'Passagem e fixação de cabeamento UTP / Coaxial (metro)',
  'Instalação de sensor de presença / barreira',
  'Instalação de central de alarme e sirene',
  'Instalação de fechadura eletrônica / eletroímã',
  'Instalação e configuração de interfone / vídeo porteiro',
  'Configuração de aplicativo para acesso remoto no celular',
  'Manutenção preventiva e limpeza de lentes de câmeras',
  'Instalação de nobreak e fonte de alimentação para CFTV'
];

export default function OrcamentoForm({ onSubmit, initialData, onCancel }) {
  const { clientes, listarClientes } = useClientes();
  const { produtos, listarProdutos } = useEstoque();

  const [clienteId, setClienteId] = useState(initialData?.clienteId || '');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [validadeDias, setValidadeDias] = useState(initialData?.validadeDias || 15);
  const [prazoExecucao, setPrazoExecucao] = useState(initialData?.prazoExecucao || '3 a 5 dias úteis');
  const [condicoesPagamento, setCondicoesPagamento] = useState(initialData?.condicoesPagamento || '50% de entrada e 50% na entrega e teste dos equipamentos');
  const [status, setStatus] = useState(initialData?.status || 'aguardando');
  const [desconto, setDesconto] = useState(initialData?.desconto || 0);
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');

  // Itens de Produtos / Equipamentos
  const [itensProdutos, setItensProdutos] = useState(initialData?.produtos || []);

  // Itens de Serviços
  const [itensServicos, setItensServicos] = useState(initialData?.servicos || [
    { id: 'srv_1', descricao: 'Instalação, conectorização e testes de funcionamento', quantidade: 1, valorUnitario: 250 }
  ]);

  useEffect(() => {
    listarClientes();
    listarProdutos();
  }, []);

  useEffect(() => {
    if (clienteId && clientes.length > 0) {
      const cli = clientes.find(c => c.id === clienteId);
      setClienteSelecionado(cli || null);
    }
  }, [clienteId, clientes]);

  // Manipulação de Produtos
  const handleAddProduto = () => {
    setItensProdutos(prev => [
      ...prev,
      {
        id: 'item_' + Date.now(),
        produtoId: '',
        nome: '',
        marca: '',
        modelo: '',
        quantidade: 1,
        unidade: 'un',
        valorUnitario: 0
      }
    ]);
  };

  const handleProdutoChange = (index, prodId) => {
    const prod = produtos.find(p => p.id === prodId);
    if (!prod) return;

    setItensProdutos(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        produtoId: prod.id,
        nome: prod.nome,
        marca: prod.marca || '',
        modelo: prod.modelo || '',
        unidade: prod.unidade || 'un',
        valorUnitario: parseFloat(prod.precoVenda) || 0,
        imagemBase64: prod.imagemBase64 || null,
      };
      return updated;
    });
  };

  const handleItemProdutoField = (index, field, value) => {
    setItensProdutos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveProduto = (index) => {
    setItensProdutos(prev => prev.filter((_, i) => i !== index));
  };

  // Manipulação de Serviços
  const handleAddServico = () => {
    setItensServicos(prev => [
      ...prev,
      {
        id: 'srv_' + Date.now(),
        descricao: '',
        quantidade: 1,
        valorUnitario: 0
      }
    ]);
  };

  const handleItemServicoField = (index, field, value) => {
    setItensServicos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveServico = (index) => {
    setItensServicos(prev => prev.filter((_, i) => i !== index));
  };

  // Cálculos de totais
  const subtotalProdutos = useMemo(() => {
    return itensProdutos.reduce((acc, item) => {
      return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
    }, 0);
  }, [itensProdutos]);

  const subtotalServicos = useMemo(() => {
    return itensServicos.reduce((acc, item) => {
      return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
    }, 0);
  }, [itensServicos]);

  const totalGeral = useMemo(() => {
    const desc = parseFloat(desconto) || 0;
    return Math.max(0, subtotalProdutos + subtotalServicos - desc);
  }, [subtotalProdutos, subtotalServicos, desconto]);

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!clienteId) {
      alert('Selecione o cliente para o orçamento.');
      return;
    }

    const payload = {
      clienteId,
      clienteNome: clienteSelecionado?.nome || '',
      clienteCpf: clienteSelecionado?.cpf || '',
      clienteTelefone: clienteSelecionado?.telefone || '',
      clienteWhatsapp: clienteSelecionado?.whatsapp || '',
      clienteEmail: clienteSelecionado?.email || '',
      clienteEndereco: clienteSelecionado?.endereco || '',
      clienteComplemento: clienteSelecionado?.complemento || '',
      clienteBairro: clienteSelecionado?.bairro || '',
      clienteCidade: clienteSelecionado?.cidade || '',
      clienteEstado: clienteSelecionado?.estado || '',
      clienteCep: clienteSelecionado?.cep || '',
      produtos: itensProdutos.map(p => ({
        produtoId: p.produtoId || '',
        nome: p.nome || 'Equipamento',
        marca: p.marca || '',
        modelo: p.modelo || '',
        quantidade: parseFloat(p.quantidade) || 1,
        unidade: p.unidade || 'un',
        valorUnitario: parseFloat(p.valorUnitario) || 0,
        subtotal: (parseFloat(p.quantidade) || 1) * (parseFloat(p.valorUnitario) || 0),
        imagemBase64: p.imagemBase64 || null,
      })),
      servicos: itensServicos.map(s => ({
        descricao: s.descricao || 'Serviço Técnico',
        quantidade: parseFloat(s.quantidade) || 1,
        valorUnitario: parseFloat(s.valorUnitario) || 0,
        subtotal: (parseFloat(s.quantidade) || 1) * (parseFloat(s.valorUnitario) || 0)
      })),
      subtotalProdutos,
      subtotalServicos,
      desconto: parseFloat(desconto) || 0,
      valorTotal: totalGeral,
      validadeDias: parseInt(validadeDias) || 15,
      prazoExecucao,
      condicoesPagamento,
      status,
      observacoes
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-8">
      {/* SELEÇÃO DO CLIENTE */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <User size={18} className="text-orange-500" />
          Cliente Solicitante *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">-- Selecione o Cliente --</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>
                {cli.nome} {cli.cpf ? `(${cli.cpf})` : ''} {cli.cidade ? `- ${cli.cidade}` : ''}
              </option>
            ))}
          </select>

          {clienteSelecionado && (
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <p><strong>Contato:</strong> {clienteSelecionado.telefone} {clienteSelecionado.whatsapp ? `| WhatsApp: ${clienteSelecionado.whatsapp}` : ''}</p>
              <p className="truncate"><strong>Endereço:</strong> {[clienteSelecionado.endereco, clienteSelecionado.bairro, clienteSelecionado.cidade].filter(Boolean).join(', ') || 'Não informado'}</p>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: EQUIPAMENTOS E MATERIAIS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Package size={18} className="text-orange-500" />
            1. Equipamentos e Materiais ({itensProdutos.length})
          </h3>
          <button
            type="button"
            onClick={handleAddProduto}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all"
          >
            <Plus size={16} />
            Adicionar Equipamento
          </button>
        </div>

        {itensProdutos.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            Nenhum equipamento adicionado ainda. Clique em "Adicionar Equipamento" para incluir câmeras, DVRs, sensores, etc.
          </div>
        ) : (
          <div className="space-y-3">
            {itensProdutos.map((item, index) => (
              <div
                key={item.id || index}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {/* Seletor ou nome */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Equipamento / Produto
                  </label>
                  <select
                    value={item.produtoId}
                    onChange={(e) => handleProdutoChange(index, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="">-- Escolha do Catálogo ou digite --</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.marca ? `[${p.marca}]` : ''} - R$ {formatCurrency(p.precoVenda || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nome customizado (se não estiver no catálogo) */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Marca / Modelo
                  </label>
                  <input
                    type="text"
                    value={item.modelo || item.marca || ''}
                    onChange={(e) => handleItemProdutoField(index, 'modelo', e.target.value)}
                    placeholder="Ex: Intelbras / HD"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>

                {/* Quantidade */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Qtd ({item.unidade || 'un'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={item.quantidade}
                    onChange={(e) => handleItemProdutoField(index, 'quantidade', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-center"
                  />
                </div>

                {/* Preço Unitário */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Valor Unit. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.valorUnitario}
                    onChange={(e) => handleItemProdutoField(index, 'valorUnitario', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-right"
                  />
                </div>

                {/* Botão Remover */}
                <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveProduto(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remover Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-right text-xs font-semibold text-slate-700 dark:text-slate-300 pr-2">
              Subtotal Equipamentos: R$ {formatCurrency(subtotalProdutos)}
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: SERVIÇOS TÉCNICOS E INSTALAÇÃO */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Wrench size={18} className="text-slate-600 dark:text-slate-400" />
            2. Serviços Técnicos e Mão de Obra ({itensServicos.length})
          </h3>
          <button
            type="button"
            onClick={handleAddServico}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
          >
            <Plus size={16} />
            Adicionar Serviço
          </button>
        </div>

        <div className="space-y-3">
          {itensServicos.map((serv, index) => (
            <div
              key={serv.id || index}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="md:col-span-7">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Descrição do Serviço Técnico
                </label>
                <input
                  type="text"
                  list={`sugestoes_servicos_${index}`}
                  value={serv.descricao}
                  onChange={(e) => handleItemServicoField(index, 'descricao', e.target.value)}
                  placeholder="Ex: Instalação e configuração de câmeras CFTV..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                />
                <datalist id={`sugestoes_servicos_${index}`}>
                  {SERVICOS_SUGERIDOS.map((sug, i) => (
                    <option key={i} value={sug} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Qtd / Pontos
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={serv.quantidade}
                  onChange={(e) => handleItemServicoField(index, 'quantidade', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-center"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Valor Unit. (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={serv.valorUnitario}
                  onChange={(e) => handleItemServicoField(index, 'valorUnitario', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-right"
                />
              </div>

              <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleRemoveServico(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remover Serviço"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="text-right text-xs font-semibold text-slate-700 dark:text-slate-300 pr-2">
            Subtotal Serviços: R$ {formatCurrency(subtotalServicos)}
          </div>
        </div>
      </div>

      {/* CONDIÇÕES, STATUS E DESCONTOS */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Validade da Proposta (Dias)
            </label>
            <input
              type="number"
              min="1"
              value={validadeDias}
              onChange={(e) => setValidadeDias(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Prazo de Execução
            </label>
            <input
              type="text"
              value={prazoExecucao}
              onChange={(e) => setPrazoExecucao(e.target.value)}
              placeholder="Ex: 3 dias úteis"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Desconto Especial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
            >
              <option value="aguardando">Aguardando Aprovação</option>
              <option value="enviado">Enviado ao Cliente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rascunho">Rascunho</option>
              <option value="recusado">Recusado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Condições de Pagamento
          </label>
          <input
            type="text"
            value={condicoesPagamento}
            onChange={(e) => setCondicoesPagamento(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Observações Técnicas / Escopo
          </label>
          <textarea
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Necessário ponto de energia 110V próximo ao rack. Não inclui obra de alvenaria..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* TOTAL GERAL */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <span>Equipamentos: <strong>R$ {formatCurrency(subtotalProdutos)}</strong></span>
          <span className="mx-2">•</span>
          <span>Serviços: <strong>R$ {formatCurrency(subtotalServicos)}</strong></span>
          {desconto > 0 && (
            <>
              <span className="mx-2">•</span>
              <span className="text-red-500">Desconto: -R$ {formatCurrency(desconto)}</span>
            </>
          )}
        </div>
        <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-2 sm:mt-0">
          Total: R$ {formatCurrency(totalGeral)}
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all shadow-md"
        >
          {initialData ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
        </button>
      </div>
    </form>
  );
}
