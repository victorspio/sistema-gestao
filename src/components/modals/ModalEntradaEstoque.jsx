import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Calendar, 
  Truck, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Percent
} from 'lucide-react';
import Modal from './Modal';
import { formatCurrency } from '../../utils/formatters';

export default function ModalEntradaEstoque({
  isOpen,
  onClose,
  produtoInicial,
  produtos = [],
  dadosFormularioPendente = null,
  quantidadeInicial = 1,
  onConfirmar
}) {
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState(produtoInicial?.id || '');
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState(quantidadeInicial || 1);
  const [precoCompra, setPrecoCompra] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);
  const [fornecedor, setFornecedor] = useState('');
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState('a_vista');
  const [lancarFinanceiro, setLancarFinanceiro] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Identificar o produto ativo
  const produtoAtivo = useMemo(() => {
    if (produtoInicial) return produtoInicial;
    return produtos.find(p => p.id === produtoSelecionadoId) || produtos[0] || null;
  }, [produtoInicial, produtos, produtoSelecionadoId]);

  // Sincronizar dados quando o modal abre ou produto muda
  useEffect(() => {
    if (isOpen) {
      const prod = produtoInicial || produtos.find(p => p.id === produtoSelecionadoId) || produtos[0];
      if (prod) {
        setProdutoSelecionadoId(prod.id);
        setPrecoCompra(prod.precoCompra ?? prod.valorCompra ?? 0);
        setPrecoVenda(prod.precoVenda ?? prod.valorVenda ?? 0);
        setFornecedor(prod.fornecedor || '');
      }
      setQuantidadeAdicionar(quantidadeInicial > 0 ? quantidadeInicial : 1);
      setDataCompra(new Date().toISOString().split('T')[0]);
      setLancarFinanceiro(true);
      setErro('');
      setSalvando(false);
    }
  }, [isOpen, produtoInicial, quantidadeInicial]);

  const qtdAtual = parseFloat(produtoAtivo?.quantidade) || 0;
  const qtdAdd = parseFloat(quantidadeAdicionar) || 0;
  const novaQtdTotal = qtdAtual + qtdAdd;
  const pCompraNum = parseFloat(precoCompra) || 0;
  const pVendaNum = parseFloat(precoVenda) || 0;
  const valorTotalCompra = qtdAdd * pCompraNum;

  const margem = pVendaNum > 0 && pCompraNum > 0
    ? (((pVendaNum - pCompraNum) / pVendaNum) * 100).toFixed(1)
    : 0;

  const handleSubmit = async (e, apenasAjuste = false) => {
    if (e) e.preventDefault();
    if (!produtoAtivo) {
      setErro('Selecione um produto.');
      return;
    }
    if (qtdAdd <= 0) {
      setErro('A quantidade a adicionar deve ser maior que zero.');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      await onConfirmar({
        produto: produtoAtivo,
        quantidadeAdicionar: qtdAdd,
        quantidadeAnterior: qtdAtual,
        novaQuantidadeTotal: novaQtdTotal,
        precoCompra: pCompraNum,
        precoVenda: pVendaNum,
        fornecedor: fornecedor.trim(),
        dataCompra,
        formaPagamento,
        lancarFinanceiro: apenasAjuste ? false : lancarFinanceiro,
        observacoes,
        dadosFormularioPendente
      });

      onClose();
    } catch (err) {
      console.error('Erro ao confirmar entrada de estoque:', err);
      setErro(err.message || 'Erro ao registrar entrada de estoque.');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Compra & Entrada de Estoque"
      size="lg"
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 p-1">
        {erro && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* 1. SELEÇÃO / EXIBIÇÃO DO PRODUTO */}
        {!produtoInicial && produtos.length > 1 ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Selecione o Produto para Entrada <span className="text-rose-500">*</span>
            </label>
            <select
              value={produtoSelecionadoId}
              onChange={(e) => {
                const id = e.target.value;
                setProdutoSelecionadoId(id);
                const p = produtos.find(item => item.id === id);
                if (p) {
                  setPrecoCompra(p.precoCompra ?? p.valorCompra ?? 0);
                  setPrecoVenda(p.precoVenda ?? p.valorVenda ?? 0);
                  setFornecedor(p.fornecedor || '');
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Atual: {p.quantidade || 0} {p.unidade || 'un'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-cyan-100 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-cyan-200 dark:border-slate-600 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold overflow-hidden shadow-sm flex-shrink-0">
                {produtoAtivo?.imagemBase64 ? (
                  <img src={produtoAtivo.imagemBase64} alt={produtoAtivo.nome} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} />
                )}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                  {produtoAtivo?.categoria || 'Produto'}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {produtoAtivo?.nome}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estoque atual em casa/depósito: <strong className="text-slate-800 dark:text-slate-200">{qtdAtual} {produtoAtivo?.unidade || 'un'}</strong>
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Novo Estoque</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {novaQtdTotal} {produtoAtivo?.unidade || 'un'}
              </span>
            </div>
          </div>
        )}

        {/* 2. QUANTIDADE E PREÇOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quantidade Adicionada <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              value={quantidadeAdicionar}
              onChange={(e) => setQuantidadeAdicionar(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: 2"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              + {qtdAdd} {produtoAtivo?.unidade || 'un'} ao estoque
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preço de Custo Unitário (R$) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precoCompra}
              onChange={(e) => setPrecoCompra(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0,00"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Quanto você pagou por un.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preço de Venda Unitário (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0,00"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Margem: <strong>{margem}%</strong>
            </span>
          </div>
        </div>

        {/* 3. CARD RESUMO FINANCEIRO DA COMPRA */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
                Valor Total desta Compra (Financeiro)
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {qtdAdd} x R$ {formatCurrency(pCompraNum)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              R$ {formatCurrency(valorTotalCompra)}
            </span>
          </div>
        </div>

        {/* 4. DADOS DA COMPRA: FORNECEDOR, DATA, PAGAMENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fornecedor / Distribuidor
            </label>
            <input
              type="text"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Ex: Intelbras, Distribuidor..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data da Compra
            </label>
            <input
              type="date"
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="a_vista">À Vista (Dinheiro / Pix)</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="boleto">Boleto Bancário</option>
              <option value="a_prazo">A Prazo</option>
            </select>
          </div>
        </div>

        {/* 5. CHECKBOX FINANCEIRO */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3 cursor-pointer select-none" onClick={() => setLancarFinanceiro(!lancarFinanceiro)}>
          <input
            type="checkbox"
            checked={lancarFinanceiro}
            onChange={(e) => setLancarFinanceiro(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Registrar no Financeiro como Despesa de Compra
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Cria o lançamento no módulo de Compras e Financeiro, atualizando o patrimônio do estoque e as despesas do período.
            </span>
          </div>
        </div>

        {/* 6. BOTÕES DE AÇÃO */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={salvando}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2"
          >
            Apenas ajustar estoque (sem lançar no financeiro)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <ShoppingCart size={16} />
              <span>{salvando ? 'Lançando...' : 'Confirmar e Lançar Compra'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
