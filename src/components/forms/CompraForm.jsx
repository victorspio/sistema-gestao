import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search } from 'lucide-react';
import { useEstoque } from '../../hooks/useEstoque';
import { calcularEntradaEstoque, calcularPrecoBaseEntrada, UNIDADES } from '../../utils/conversaoUnidades';

// Schema de validação
const compraSchema = z.object({
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  dataCompra: z.string().min(1, 'Data é obrigatória'),
  itens: z.array(
    z.object({
      nomeProduto:    z.string().min(1, 'Nome do produto é obrigatório'),
      categoria:      z.string().optional(),
      unidadeCompra:  z.string().min(1, 'Unidade de compra é obrigatória'),
      fatorConversao: z.coerce.number().min(1, 'Fator deve ser ≥ 1'),
      unidade:        z.string().min(1, 'Unidade base é obrigatória'),
      quantidade:     z.coerce.number().min(0.001, 'Quantidade é obrigatória'),
      valorCompra:    z.coerce.number().min(0, 'Valor de compra é obrigatório'),
      valorVenda:     z.coerce.number().min(0, 'Valor de venda é obrigatório')
    })
  ).min(1, 'Adicione pelo menos um item'),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional()
});

export default function CompraForm({ onSubmit, initialData }) {
  const [valorTotal, setValorTotal] = useState(0);
  const [produtoSugestoes, setProdutoSugestoes] = useState({});
  const [inputFocado, setInputFocado] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [itensDoEstoque, setItensDoEstoque] = useState({});
  const dropdownRefs = useRef({});
  const { produtos, listarProdutos } = useEstoque();

  useEffect(() => {
    listarProdutos();
  }, [listarProdutos]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      fornecedor: '',
      dataCompra: new Date().toISOString().split('T')[0],
      itens: [{
        nomeProduto: '', categoria: '', unidadeCompra: 'un',
        fatorConversao: 1, unidade: 'un', quantidade: '',
        valorCompra: '', valorVenda: ''
      }],
      formaPagamento: '',
      observacoes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' });
  const watchedValues = watch();

  useEffect(() => {
    if (formInitialized) return;
    if (initialData) {
      const itensFormatados = (initialData.itens || []).map(item => ({
        nomeProduto:    item.nomeProduto || '',
        categoria:      item.categoria || '',
        unidade:        item.unidade || 'un',
        unidadeCompra:  item.unidadeCompra || item.unidade || 'un',
        fatorConversao: Number(item.fatorConversao) || 1,
        quantidade:     item.quantidade ? parseFloat(Number(item.quantidade).toFixed(3)).toString() : '',
        valorCompra:    item.valorCompra?.toString() || item.valorUnitario?.toString() || '',
        valorVenda:     item.valorVenda?.toString() || ''
      }));
      reset({
        fornecedor: initialData.fornecedor || '',
        dataCompra: initialData.dataCompra
          ? (typeof initialData.dataCompra === 'string'
              ? initialData.dataCompra.split('T')[0]
              : initialData.dataCompra.toDate
                ? new Date(initialData.dataCompra.toDate()).toISOString().split('T')[0]
                : new Date(initialData.dataCompra).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        itens: itensFormatados.length > 0 ? itensFormatados : [{ nomeProduto: '', categoria: '', unidade: 'un', unidadeCompra: 'un', fatorConversao: 1, quantidade: '', valorCompra: '', valorVenda: '' }],
        formaPagamento: initialData.formaPagamento || '',
        observacoes:    initialData.observacoes    || ''
      });
      setFormInitialized(true);
    } else {
      setFormInitialized(true);
    }
  }, [initialData, reset, formInitialized]);

  useEffect(() => {
    if (watchedValues.itens && Array.isArray(watchedValues.itens)) {
      const total = watchedValues.itens.reduce((acc, item) => {
        return acc + (parseFloat(item.quantidade) || 0) * (parseFloat(item.valorCompra) || 0);
      }, 0);
      setValorTotal(total);
    }
  }, [watchedValues]);

  const buscarProdutosSimilares = (texto, index) => {
    if (!texto || texto.length === 0) {
      setProdutoSugestoes(prev => ({ ...prev, [index]: produtos.filter(p => p.ativo !== false).slice(0, 8) }));
      return;
    }
    const textoLower = texto.toLowerCase();
    const similares = produtos
      .filter(p => p.ativo !== false && (
        p.nome?.toLowerCase().includes(textoLower) ||
        p.codigo?.toLowerCase().includes(textoLower) ||
        p.marca?.toLowerCase().includes(textoLower) ||
        p.sku?.toLowerCase().includes(textoLower)
      ))
      .slice(0, 8);
    setProdutoSugestoes(prev => ({ ...prev, [index]: similares }));
  };

  const selecionarProduto = (index, produto) => {
    setValue(`itens.${index}.nomeProduto`,    produto.nome);
    setValue(`itens.${index}.categoria`,      produto.categoria || '');
    setValue(`itens.${index}.unidade`,        produto.unidade || 'un');
    setValue(`itens.${index}.unidadeCompra`,  produto.unidade || 'un');
    setValue(`itens.${index}.fatorConversao`, Number(produto.fatorConversao) || 1);
    setValue(`itens.${index}.valorCompra`,    produto.precoCompra || produto.valorCompra || '');
    setValue(`itens.${index}.valorVenda`,     produto.precoVenda  || produto.valorVenda  || '');
    // Quantidade NÃO é preenchida — o usuário informa quantos comprou
    setItensDoEstoque(prev => ({ ...prev, [index]: { estoqueAtual: produto.quantidade || 0 } }));
    setProdutoSugestoes(prev => ({ ...prev, [index]: [] }));
    setInputFocado(null);
  };

  const handleNomeProdutoChange = (e, index) => {
    register(`itens.${index}.nomeProduto`).onChange(e);
    buscarProdutosSimilares(e.target.value, index);
    if (itensDoEstoque[index]) {
      setItensDoEstoque(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isInside = false;
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) isInside = true;
      });
      if (!isInside) setInputFocado(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = async (data) => {
    const dadosProcessados = {
      ...data,
      valorTotal,
      itens: data.itens.map(item => {
        const fator     = Number(item.fatorConversao) || 1;
        const qtdCompra = parseFloat(item.quantidade)  || 0;
        const qtdBase   = calcularEntradaEstoque(qtdCompra, fator);
        const precoBase = calcularPrecoBaseEntrada(parseFloat(item.valorCompra) || 0, fator);
        return {
          ...item,
          quantidadeComprada: qtdCompra,
          unidadeComprada:    item.unidadeCompra,
          fatorConversao:     fator,
          quantidade:         qtdBase,
          valorCompra:        precoBase,
          valorVenda:         parseFloat(item.valorVenda),
        };
      })
    };
    await onSubmit(dadosProcessados);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fornecedor *</label>
          <input type="text" {...register('fornecedor')}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            placeholder="Nome do fornecedor" />
          {errors.fornecedor && <p className="mt-1 text-sm text-red-600">{errors.fornecedor.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data da Compra *</label>
          <input type="date" {...register('dataCompra')}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
          {errors.dataCompra && <p className="mt-1 text-sm text-red-600">{errors.dataCompra.message}</p>}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Produtos Comprados</h3>
          <button type="button"
            onClick={() => append({ nomeProduto: '', categoria: '', unidade: 'un', unidadeCompra: 'un', fatorConversao: 1, quantidade: '', valorCompra: '', valorVenda: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm">
            <Plus size={15} /> Adicionar Produto
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-16 gap-4">

                {/* Nome do Produto com Autocomplete */}
                <div className="md:col-span-3 relative">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Produto *</label>
                    {itensDoEstoque[index] && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 text-[10px] font-semibold">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        Do Estoque · {itensDoEstoque[index].estoqueAtual} em estoque
                      </span>
                    )}
                  </div>
                  <div className="relative" ref={el => dropdownRefs.current[index] = el}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input type="text" {...register(`itens.${index}.nomeProduto`)}
                      onChange={e => handleNomeProdutoChange(e, index)}
                      onFocus={() => { setInputFocado(index); buscarProdutosSimilares(watchedValues.itens?.[index]?.nomeProduto || '', index); }}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Digite ou selecione um produto..." autoComplete="off" />

                    {inputFocado === index && produtoSugestoes[index]?.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 px-2">
                            Produtos no estoque — clique para preencher automaticamente:
                          </p>
                          {produtoSugestoes[index].map(produto => (
                            <div key={produto.id}
                              onMouseDown={e => { e.preventDefault(); selecionarProduto(index, produto); }}
                              className="px-3 py-2.5 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 rounded-lg transition-colors cursor-pointer">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{produto.nome}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {produto.categoria && <span>{produto.categoria} · </span>}
                                    Estoque: <strong>{produto.quantidade || 0}</strong> {produto.unidade || 'un'}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                                    R$ {(produto.precoCompra || produto.valorUnitario || 0).toFixed(2)}
                                  </p>
                                  <p className="text-[10px] text-slate-400">últ. compra</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {produtoSugestoes[index].length === 8 && (
                            <p className="text-[10px] text-slate-400 text-center pt-1.5 pb-0.5">Continue digitando para refinar a busca</p>
                          )}
                        </div>
                      </div>
                    )}

                    {inputFocado === index && produtoSugestoes[index]?.length === 0 && (watchedValues.itens?.[index]?.nomeProduto?.length || 0) > 1 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                        <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                          Nenhum produto encontrado — será cadastrado como novo
                        </p>
                      </div>
                    )}
                  </div>
                  {errors.itens?.[index]?.nomeProduto && <p className="mt-1 text-sm text-red-600">{errors.itens[index].nomeProduto.message}</p>}
                </div>

                {/* Categoria */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Categoria</label>
                  <input type="text" {...register(`itens.${index}.categoria`)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ex: Materiais" />
                </div>

                {/* Unidade de Compra */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidade de Compra *</label>
                  <select {...register(`itens.${index}.unidadeCompra`)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    {Object.entries(UNIDADES).map(([sigla, { nome }]) => (
                      <option key={sigla} value={sigla}>{sigla.toUpperCase()} — {nome}</option>
                    ))}
                    <option value="SC">SC — Saco</option>
                    <option value="CX">CX — Caixa</option>
                    <option value="FD">FD — Fardo</option>
                  </select>
                </div>

                {/* Fator de Conversão */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fator *</label>
                  <input type="number" min="1" step="any" {...register(`itens.${index}.fatorConversao`)}
                    onWheel={e => e.target.blur()}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="1" title="Qtd de unidades base em 1 unidade de compra" />
                  {errors.itens?.[index]?.fatorConversao && <p className="mt-1 text-xs text-red-600">{errors.itens[index].fatorConversao.message}</p>}
                </div>

                {/* Unidade Base */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unidade Base *</label>
                  <select {...register(`itens.${index}.unidade`)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    {Object.entries(UNIDADES).map(([sigla, { nome }]) => (
                      <option key={sigla} value={sigla}>{sigla.toUpperCase()} — {nome}</option>
                    ))}
                  </select>
                  {errors.itens?.[index]?.unidade && <p className="mt-1 text-sm text-red-600">{errors.itens[index].unidade.message}</p>}
                </div>

                {/* Quantidade — deixado em branco ao selecionar produto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Quantidade *
                    {itensDoEstoque[index] && (
                      <span className="ml-1.5 text-cyan-500 dark:text-cyan-400 text-xs font-normal">← informe quantos comprou</span>
                    )}
                  </label>
                  <input type="number" step="0.01" {...register(`itens.${index}.quantidade`)}
                    onWheel={e => e.target.blur()}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="0" />
                  {errors.itens?.[index]?.quantidade && <p className="mt-1 text-sm text-red-600">{errors.itens[index].quantidade.message}</p>}
                </div>

                {/* Valor de Compra */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor de Compra *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white text-sm">R$</span>
                    <input type="number" step="0.01" {...register(`itens.${index}.valorCompra`)}
                      onWheel={e => e.target.blur()}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="0,00" />
                  </div>
                  {errors.itens?.[index]?.valorCompra && <p className="mt-1 text-sm text-red-600">{errors.itens[index].valorCompra.message}</p>}
                </div>

                {/* Valor de Venda */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor de Venda *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white text-sm">R$</span>
                    <input type="number" step="0.01" {...register(`itens.${index}.valorVenda`)}
                      onWheel={e => e.target.blur()}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="0,00" />
                  </div>
                  {errors.itens?.[index]?.valorVenda && <p className="mt-1 text-sm text-red-600">{errors.itens[index].valorVenda.message}</p>}
                </div>

                {/* Remover Item */}
                <div className="md:col-span-1 flex items-end">
                  {fields.length > 1 && (
                    <button type="button"
                      onClick={() => { remove(index); setItensDoEstoque(prev => { const n = { ...prev }; delete n[index]; return n; }); }}
                      className="w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remover item">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>

        {errors.itens && typeof errors.itens.message === 'string' && (
          <p className="mt-2 text-sm text-red-600">{errors.itens.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-700 pt-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Forma de Pagamento</label>
          <select {...register('formaPagamento')}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all">
            <option value="">Selecione...</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
            <option value="cheque">Cheque</option>
            <option value="prazo">A Prazo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor Total</label>
          <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold text-lg">
            R$ {valorTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Observações</label>
        <textarea {...register('observacoes')} rows={3}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none"
          placeholder="Informações adicionais sobre a compra..." />
      </div>

      <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
        <button type="button" onClick={() => onSubmit(null)}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow">
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Compra' : 'Salvar Compra'}
        </button>
      </div>
    </form>
  );
}
