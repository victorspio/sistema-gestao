import React, { useState, useEffect, useRef } from 'react';
import PageLayout from '../../components/layout-new/PageLayout';
import { useEmpresa, DEFAULT_EMPRESA_CONFIG } from '../../contexts/EmpresaContext';
import { PALETAS_PREDEFINIDAS, hexToRgb } from '../../utils/colorHelpers';
import { 
  Building2, 
  Palette, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Eye,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import Logo from '../../components/ui/Logo';

export default function ConfiguracoesPage() {
  const { empresa, salvarConfiguracoes, restaurarPadroes } = useEmpresa();

  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    ie: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    cidade: '',
    cep: '',
    logoSidebar: '',
    corPrimaria: '#00c8ff',
    corSidebar: '#060d30',
  });

  const [abaAtiva, setAbaAtiva] = useState('geral'); // 'geral' | 'logo' | 'cores'
  const [salvando, setSalvando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const fileInputRef = useRef(null);

  // Sincroniza estado com o contexto da empresa
  useEffect(() => {
    if (empresa) {
      setFormData(prev => ({
        ...prev,
        ...empresa
      }));
    }
  }, [empresa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Upload e compressão da Logo (limita resolução para leveza no Firestore)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErroMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64Otimizado = canvas.toDataURL('image/png', 0.9);
        setFormData(prev => ({ ...prev, logoSidebar: base64Otimizado }));
        setSucessoMsg('Logo carregada com sucesso! Clique em "Salvar Alterações" para aplicar.');
        setTimeout(() => setSucessoMsg(''), 4000);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverLogo = () => {
    setFormData(prev => ({ ...prev, logoSidebar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelecionarPaleta = (paleta) => {
    setFormData(prev => ({
      ...prev,
      corPrimaria: paleta.corPrimaria,
      corSidebar: paleta.corSidebar
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setSalvando(true);
      setErroMsg('');
      await salvarConfiguracoes(formData);
      setSucessoMsg('Configurações da empresa salvas com sucesso!');
      setTimeout(() => setSucessoMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setErroMsg('Erro ao salvar configurações: ' + (err.message || 'Tente novamente'));
    } finally {
      setSalvando(false);
    }
  };

  const handleRestaurar = async () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações originais da Zeu-Tech?')) {
      try {
        setSalvando(true);
        await restaurarPadroes();
        setFormData(DEFAULT_EMPRESA_CONFIG);
        setSucessoMsg('Configurações restauradas para o padrão com sucesso!');
        setTimeout(() => setSucessoMsg(''), 4000);
      } catch (err) {
        setErroMsg('Erro ao restaurar: ' + err.message);
      } finally {
        setSalvando(false);
      }
    }
  };

  return (
    <PageLayout title="Configurações da Empresa">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* FEEDBACK TOASTS */}
        {sucessoMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm shadow-sm transition-all animate-in fade-in">
            <Check size={18} className="text-emerald-600 flex-shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {erroMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-300 text-sm shadow-sm transition-all animate-in fade-in">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <span>{erroMsg}</span>
          </div>
        )}

        {/* CABEÇALHO COM ABAS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva('geral')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              abaAtiva === 'geral'
                ? 'bg-[var(--brand-primary,#00c8ff)] text-slate-900 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Building2 size={18} />
            Dados da Empresa
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('logo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              abaAtiva === 'logo'
                ? 'bg-[var(--brand-primary,#00c8ff)] text-slate-900 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <ImageIcon size={18} />
            Logo (Sidebar & PDFs)
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('cores')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              abaAtiva === 'cores'
                ? 'bg-[var(--brand-primary,#00c8ff)] text-slate-900 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Palette size={18} />
            Cores & Identidade Visual
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ABA 1: DADOS DA EMPRESA */}
          {abaAtiva === 'geral' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 size={20} className="text-[var(--brand-primary,#00c8ff)]" />
                  Identificação Institucional
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Estes dados serão exibidos no cabeçalho do sistema, nas Ordens de Serviço, Propostas de Orçamento e Comprovantes de Venda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome de Exibição da Empresa *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Minha Empresa"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Aparece na barra lateral e títulos</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    name="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={handleChange}
                    placeholder="Ex: Razão Social Ltda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    name="ie"
                    value={formData.ie}
                    onChange={handleChange}
                    placeholder="Isento ou número da IE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telefone Comercial
                  </label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(00) 0000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="(00) 90000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contato@suaempresa.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Endereço Completo (Rua, Número, Bairro)
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua Exemplo, 123 - Centro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cidade e Estado (UF)
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Ex: Quixadá - CE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary,#00c8ff)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: LOGO DO SISTEMA & PDFS */}
          {abaAtiva === 'logo' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-[var(--brand-primary,#00c8ff)]" />
                  Logo da Sidebar e dos Documentos PDF
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Envie a logo da sua empresa com fundo transparente (formato PNG recomendado). Ela será aplicada na barra lateral e nos relatórios em PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* UPLOAD BOX */}
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[var(--brand-primary,#00c8ff)] rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/30 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-[var(--brand-primary,#00c8ff)] group-hover:scale-110 transition-all">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Clique para selecionar a imagem da logo
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG ou SVG (recomendado tamanho proporcional ou horizontal)
                    </p>
                  </div>

                  {formData.logoSidebar && (
                    <button
                      type="button"
                      onClick={handleRemoverLogo}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Trash2 size={15} />
                      Remover Logo Personalizada (Usar Padrão)
                    </button>
                  )}
                </div>

                {/* PREVIEW BOX */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye size={14} /> Pré-visualização em Tempo Real
                  </h4>

                  {/* PREVIEW NA SIDEBAR (FUNDO ESCURO) */}
                  <div 
                    style={{ backgroundColor: formData.corSidebar }}
                    className="p-5 rounded-2xl border border-white/10 shadow-lg flex items-center gap-4"
                  >
                    <div className="h-12 w-auto max-w-[120px] flex items-center justify-center">
                      {formData.logoSidebar ? (
                        <img
                          src={formData.logoSidebar}
                          alt="Logo Preview"
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <Logo size="md" />
                      )}
                    </div>
                    <div>
                      <p 
                        style={{ color: formData.corPrimaria }}
                        className="font-bold tracking-wider uppercase text-xs"
                      >
                        {formData.nome || 'Nome da Empresa'}
                      </p>
                      <span className="text-[10px] text-slate-400">Na Barra Lateral</span>
                    </div>
                  </div>

                  {/* PREVIEW NO PDF (FUNDO CLARO COM CABEÇALHO) */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Cabeçalho de Orçamentos e OS (PDF)
                    </span>
                    <div 
                      style={{ backgroundColor: formData.corSidebar }}
                      className="p-3.5 rounded-xl text-white flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs">{formData.nome || 'Nome da Empresa'}</p>
                        <p className="text-[10px] text-slate-300">CNPJ: {formData.cnpj || '00.000.000/0001-00'}</p>
                      </div>
                      <div className="h-9 w-auto max-w-[90px] flex items-center justify-center">
                        {formData.logoSidebar ? (
                          <img
                            src={formData.logoSidebar}
                            alt="Logo PDF Preview"
                            className="max-h-9 max-w-full object-contain"
                          />
                        ) : (
                          <Logo size="sm" />
                        )}
                      </div>
                    </div>
                    <div 
                      style={{ backgroundColor: formData.corPrimaria }}
                      className="h-1 w-full rounded-b"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ABA 3: CORES & IDENTIDADE VISUAL */}
          {abaAtiva === 'cores' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Palette size={20} className="text-[var(--brand-primary,#00c8ff)]" />
                  Personalização de Cores do Sistema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Defina a identidade visual do sistema escolhendo uma paleta pronta ou personalizando cada cor.
                </p>
              </div>

              {/* PALETAS PRONTAS */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Paletas Pré-definidas (1 Clique)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PALETAS_PREDEFINIDAS.map((paleta) => {
                    const isSelecionada = 
                      formData.corPrimaria.toLowerCase() === paleta.corPrimaria.toLowerCase() &&
                      formData.corSidebar.toLowerCase() === paleta.corSidebar.toLowerCase();

                    return (
                      <div
                        key={paleta.id}
                        onClick={() => handleSelecionarPaleta(paleta)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelecionada
                            ? 'border-2 border-[var(--brand-primary,#00c8ff)] bg-slate-50 dark:bg-slate-700/50 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-slate-800 dark:text-white">
                            {paleta.nome}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {paleta.descricao}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            title="Cor Primária"
                            className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: paleta.corPrimaria }}
                          />
                          <span
                            title="Cor Sidebar"
                            className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: paleta.corSidebar }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELETORES INDIVIDUAIS DE COR */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                  Ajuste Fino de Cores (Hexadecimal)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* COR PRIMÁRIA */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Cor Primária (Destaques, Botões e Links Ativos)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.corPrimaria}
                        onChange={(e) => setFormData(prev => ({ ...prev, corPrimaria: e.target.value }))}
                        className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        name="corPrimaria"
                        value={formData.corPrimaria}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                  {/* COR DA SIDEBAR */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Cor de Fundo da Barra Lateral (Sidebar)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.corSidebar}
                        onChange={(e) => setFormData(prev => ({ ...prev, corSidebar: e.target.value }))}
                        className="w-12 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        name="corSidebar"
                        value={formData.corSidebar}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-white uppercase"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* DEMONSTRAÇÃO VISUAL DOS ELEMENTOS */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Eye size={14} /> Prévia dos Botões e Elementos da Interface
                </h4>
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-4">
                  
                  {/* BOTÃO PRINCIPAL COM COR DINÂMICA */}
                  <button
                    type="button"
                    style={{ backgroundColor: formData.corPrimaria }}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 shadow-md flex items-center gap-2 cursor-default"
                  >
                    Botão Principal
                  </button>

                  {/* BADGE COM COR DINÂMICA */}
                  <span
                    style={{ 
                      backgroundColor: `${formData.corPrimaria}20`,
                      color: formData.corPrimaria,
                      borderColor: `${formData.corPrimaria}40`
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border"
                  >
                    Item Selecionado
                  </span>

                  {/* MINI BARRA LATERAL PREVIEW */}
                  <div
                    style={{ backgroundColor: formData.corSidebar }}
                    className="px-4 py-2 rounded-xl text-white text-xs flex items-center gap-2 border border-white/10"
                  >
                    <span 
                      style={{ backgroundColor: formData.corPrimaria }}
                      className="w-2 h-2 rounded-full" 
                    />
                    <span>{formData.nome || 'Sua Empresa'}</span>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* BARRA DE AÇÕES (FIXA/FLUTUANTE NO FINAL) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRestaurar}
              disabled={salvando}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RotateCcw size={15} />
              Restaurar Padrões da Zeu-Tech
            </button>

            <button
              type="submit"
              disabled={salvando}
              style={{ backgroundColor: formData.corPrimaria }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <Save size={16} />
              {salvando ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>

      </div>
    </PageLayout>
  );
}
