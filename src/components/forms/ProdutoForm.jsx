import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, X } from 'lucide-react';

// Redimensiona e comprime imagem para base64 (JPEG, máx 400px, 80% qualidade)
function comprimirImagem(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.80));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Categorias de Equipamentos e Produtos de Segurança Eletrônica
export const CATEGORIAS = [
  'Câmeras IP / Wi-Fi',
  'Câmeras HD / Analógicas',
  'Gravadores (DVR / NVR)',
  'Armazenamento (HDs)',
  'Alarmes e Centrais',
  'Sensores (Presença, Barreira, Abertura)',
  'Centrais de Choque e Cerca Elétrica',
  'Controle de Acesso e Biometria',
  'Fechaduras Digitais e Eletroímãs',
  'Interfonia e Vídeo Porteiro',
  'Fontes de Alimentação',
  'Nobreaks e Baterias',
  'Cabos e Fios',
  'Conectores e Adaptadores',
  'Racks e Gabinetes',
  'Redes e Switches (PoE)',
  'Acessórios e Fixação'
];

const produtoSchema = z.object({
  codigo: z.string().optional(),
  sku: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  descricao: z.string().optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  quantidade: z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0, 'Quantidade deve ser maior ou igual a 0')),
  estoqueMinimo: z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0')),
  precoCompra: z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0, 'Preço de compra deve ser maior ou igual a 0')),
  precoVenda: z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0, 'Preço de venda deve ser maior ou igual a 0')),
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  // Campos de fracionamento (novos + retrocompatíveis)
  vendaFracionada:     z.boolean().optional(),
  permiteFragmentacao: z.boolean().optional(),  // alias mais descritivo
  fatorConversao:      z.preprocess(val => val === '' ? 1 : val, z.coerce.number().min(1).optional()),
  unidadeVenda:        z.string().optional(),
  precoVendaUnitario:  z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0).optional()),
  incrementoMinimoVenda: z.preprocess(val => val === '' ? 0 : val, z.coerce.number().min(0).optional()),
});

export default function ProdutoForm({ onSubmit, initialData, onCancel }) {
  // ── Imagem (gerenciada fora do react-hook-form) ──────────────────────────────
  const [imagemBase64, setImagemBase64] = useState(initialData?.imagemBase64 || null);
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await comprimirImagem(file);
    setImagemBase64(base64);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoverImagem = () => {
    setImagemBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const categoriasPlaceholder = 'Ex: Câmeras IP, DVR, Alarmes, Sensores...';
  const formattedInitialData = useMemo(() => {
    if (!initialData) return null;
    return {
      codigo:           initialData.codigo    || '',
      sku:              initialData.sku       || '',
      nome:             initialData.nome      || '',
      marca:            initialData.marca     || '',
      modelo:           initialData.modelo    || '',
      descricao:        initialData.descricao || '',
      categoria:        initialData.categoria || '',
      unidade:          initialData.unidade   || 'un',
      quantidade: (typeof initialData.quantidade === 'number' && initialData.quantidade % 1 !== 0)
        ? parseFloat(initialData.quantidade.toFixed(3))
        : (initialData.quantidade !== undefined ? initialData.quantidade : ''),
      estoqueMinimo:        initialData.estoqueMinimo    !== undefined ? initialData.estoqueMinimo : '',
      precoCompra:          initialData.precoCompra      || '',
      precoVenda:           initialData.precoVenda       || '',
      fornecedor:           initialData.fornecedor       || '',
      localizacao:          initialData.localizacao      || '',
      vendaFracionada:      initialData.vendaFracionada      || initialData.permiteFragmentacao || false,
      permiteFragmentacao:  initialData.permiteFragmentacao  || initialData.vendaFracionada    || false,
      fatorConversao:       initialData.fatorConversao       || 1,
      unidadeVenda:         initialData.unidadeVenda          || 'un',
      precoVendaUnitario:   initialData.precoVendaUnitario    || '',
      incrementoMinimoVenda: initialData.incrementoMinimoVenda ?? 0,
    };
  }, [initialData]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(produtoSchema),
    defaultValues: formattedInitialData || {
      codigo:               '',
      sku:                  '',
      nome:                 '',
      marca:                '',
      modelo:               '',
      descricao:            '',
      categoria:            '',
      unidade:              'un',
      quantidade:           '',
      estoqueMinimo:        5,
      precoCompra:          '',
      precoVenda:           '',
      fornecedor:           '',
      localizacao:          '',
      vendaFracionada:      false,
      permiteFragmentacao:  false,
      fatorConversao:       1,
      unidadeVenda:         'un',
      precoVendaUnitario:   '',
      incrementoMinimoVenda: 0,
    }
  });

  const onSubmitForm = async (data) => {
    try {
      const fatNum = Number(data.fatorConversao) || 1;
      const isFracUnit = ['kg', 'g', 'l', 'ml', 'm', 'm2', 'm3'].includes(data.unidade?.toLowerCase());
      const fracionavel = fatNum > 1 || isFracUnit;

      const dadosProcessados = {
        ...data,
        quantidade:          Number(data.quantidade)    || 0,
        estoqueMinimo:       Number(data.estoqueMinimo) || 0,
        precoCompra:         Number(data.precoCompra)   || 0,
        precoVenda:          Number(data.precoVenda)    || 0,
        // Sincroniza campos de venda fracionada implicitamente
        vendaFracionada:     fracionavel,
        permiteFragmentacao: fracionavel,
        fatorConversao:      fatNum,
        unidadeVenda:        fracionavel ? (data.unidadeVenda || data.unidade || 'un') : (data.unidade || 'un'),
        precoVendaUnitario:  fracionavel ? (Number(data.precoVendaUnitario) || 0) : 0,
        incrementoMinimoVenda: Number(data.incrementoMinimoVenda) || 0,
        // Imagem base64 gerenciada fora do react-hook-form
        imagemBase64: imagemBase64 || null,
      };
      await onSubmit(dadosProcessados);
    } catch (error) {
      if (!error.message?.includes('Já existe')) {
        console.error('Erro ao salvar produto:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Nome do Equipamento / Produto *
        </label>
        <input
          type="text"
          {...register('nome')}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Ex: Câmera Dome Full HD 1080p IR 20m"
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>
        )}
      </div>

      {/* Marca e Modelo / SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Marca / Fabricante
          </label>
          <input
            type="text"
            {...register('marca')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: Intelbras, Hikvision, JFL, PPA..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Modelo / SKU
          </label>
          <input
            type="text"
            {...register('modelo')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: VHD 1120 D G6 / SKU-8841"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Descrição / Especificações Técnicas
        </label>
        <textarea
          {...register('descricao')}
          rows={3}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Ex: Lente 2.8mm, proteção IP66 contra chuva, alcance 20 metros..."
        />
      </div>

      {/* Categoria e Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Categoria *
          </label>
          <input
            type="text"
            {...register('categoria')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder={categoriasPlaceholder}
            list="categorias"
            autoComplete="off"
          />
          <datalist id="categorias">
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {errors.categoria && (
            <p className="mt-1 text-sm text-red-500">{errors.categoria.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Unidade de Medida *
          </label>
          <select
            {...register('unidade')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="un">Unidade (un)</option>
            <option value="m">Metro (m)</option>
            <option value="rl">Rolo (rl)</option>
            <option value="kit">Kit (kit)</option>
            <option value="pc">Peça (pc)</option>
            <option value="cx">Caixa (cx)</option>
            <option value="pct">Pacote (pct)</option>
            <option value="par">Par (par)</option>
          </select>
          {errors.unidade && (
            <p className="mt-1 text-sm text-red-500">{errors.unidade.message}</p>
          )}
        </div>
      </div>

      {/* Quantidade e Estoque Mínimo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Quantidade Atual em Estoque *
          </label>
          <input
            type="number"
            step="any"
            {...register('quantidade')}
            onWheel={(e) => e.target.blur()}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="0"
          />
          {errors.quantidade && (
            <p className="mt-1 text-sm text-red-500">{errors.quantidade.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Estoque Mínimo *
          </label>
          <input
            type="number"
            step="any"
            {...register('estoqueMinimo')}
            onWheel={(e) => e.target.blur()}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="5"
          />
          {errors.estoqueMinimo && (
            <p className="mt-1 text-sm text-red-500">{errors.estoqueMinimo.message}</p>
          )}
        </div>
      </div>

      {/* Preços */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Preço de Compra *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white">R$</span>
            <input
              type="number"
              step="any"
              {...register('precoCompra')}
              onWheel={(e) => e.target.blur()}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0,00"
            />
          </div>
          {errors.precoCompra && (
            <p className="mt-1 text-sm text-red-500">{errors.precoCompra.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Preço de Venda *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white">R$</span>
            <input
              type="number"
              step="any"
              {...register('precoVenda')}
              onWheel={(e) => e.target.blur()}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0,00"
            />
          </div>
          {errors.precoVenda && (
            <p className="mt-1 text-sm text-red-500">{errors.precoVenda.message}</p>
          )}
        </div>
      </div>

      {/* Venda Fracionada / Conversão */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Venda Fracionada e Conversão de Embalagem
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Preencha se o produto for comprado em caixa/fardo e vendido por unidade, ou se for vendido fracionado por peso/volume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fator de Conversão
            </label>
            <input
              type="number"
              {...register('fatorConversao')}
              onWheel={(e) => e.target.blur()}
              placeholder="Ex: 10 (ex: Saco de 10kg)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Qtd de sub-itens na embalagem</p>
            {errors.fatorConversao && (
              <p className="mt-1 text-sm text-red-500">{errors.fatorConversao.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Unidade de Venda
            </label>
            <select
              {...register('unidadeVenda')}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="g">Grama (g)</option>
              <option value="l">Litro (l)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="m">Metro (m)</option>
              <option value="m2">Metro² (m²)</option>
              <option value="pc">Peça (pc)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unidade de fração ao vender</p>
            {errors.unidadeVenda && (
              <p className="mt-1 text-sm text-red-500">{errors.unidadeVenda.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preço Venda Unitário
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white">R$</span>
              <input
                type="number"
                step="any"
                {...register('precoVendaUnitario')}
                onWheel={(e) => e.target.blur()}
                placeholder="Calculado se vazio"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Deixe em branco para auto-calcular</p>
            {errors.precoVendaUnitario && (
              <p className="mt-1 text-sm text-red-500">{errors.precoVendaUnitario.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Incremento Mínimo
            </label>
            <input
              type="number"
              step="any"
              min="0"
              {...register('incrementoMinimoVenda')}
              onWheel={(e) => e.target.blur()}
              placeholder="0 = livre"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ex: 0.1 para frações de 100g</p>
            {errors.incrementoMinimoVenda && (
              <p className="mt-1 text-sm text-red-500">{errors.incrementoMinimoVenda.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Outras Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Fornecedor
          </label>
          <input
            type="text"
            {...register('fornecedor')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Nome do fornecedor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Localização
          </label>
          <input
            type="text"
            {...register('localizacao')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Ex: Prateleira A3, Galpão 2..."
          />
        </div>
      </div>

      {/* ── Imagem do Produto ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Imagem do Produto
          <span className="ml-2 text-xs font-normal text-slate-400">(aparece no PDF do orçamento)</span>
        </label>

        {imagemBase64 ? (
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex-shrink-0">
              <img src={imagemBase64} alt="Preview do produto" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Imagem selecionada e comprimida.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <ImagePlus size={13} />
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={handleRemoverImagem}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <X size={13} />
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/10 transition-all group cursor-pointer"
          >
            <ImagePlus size={22} className="text-slate-400 group-hover:text-cyan-500 transition-colors mb-1" />
            <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors">
              Clique para selecionar uma imagem
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, WEBP — será comprimida automaticamente</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar Produto' : 'Cadastrar Produto'}
        </button>
      </div>
    </form>
  );
}
