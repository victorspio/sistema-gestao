import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';

const STORAGE_KEY = '@app:empresa_config';

export const DEFAULT_EMPRESA_CONFIG = {
  nome: 'Zeu-Tech',
  razaoSocial: 'Zeu Tech Informática Ltda',
  cnpj: '66.819.439/0001-59',
  ie: '',
  telefone: '(88) 9.9964-8656',
  whatsapp: '(88) 9.9964-8656',
  email: 'zeutech.online@gmail.com',
  endereco: 'Jeronimo Batista, N: 4516',
  cidade: 'Quixadá - CE',
  cep: '',
  // Logo personalizada (base64 ou URL). Se nulo/vazio, usa a logo padrão
  logoSidebar: '',
  // Cores do sistema
  corPrimaria: '#00c8ff', // Ciano padrão
  corSidebar: '#060d30',  // Azul escuro padrão
  corSidebarHover: '#0d1f4d',
};

const EmpresaContext = createContext({});

// Aplica as cores como variáveis CSS dinâmicas no elemento :root
function aplicarVariaveisCss(config) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const primária = config.corPrimaria || DEFAULT_EMPRESA_CONFIG.corPrimaria;
  const sidebar = config.corSidebar || DEFAULT_EMPRESA_CONFIG.corSidebar;

  root.style.setProperty('--brand-primary', primária);
  root.style.setProperty('--brand-sidebar', sidebar);
  root.style.setProperty('--zt-cyan-500', primária);
  root.style.setProperty('--zt-dark', sidebar);

  // Altera o título da página caso esteja no padrão
  if (config.nome && (!document.title || document.title.includes('Zeu-Tech') || document.title.includes('Sistema'))) {
    document.title = `${config.nome} - Sistema de Gestão`;
  }
}

export function EmpresaProvider({ children }) {
  const [empresa, setEmpresa] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        return { ...DEFAULT_EMPRESA_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Erro ao ler cache de empresa:', e);
    }
    return DEFAULT_EMPRESA_CONFIG;
  });

  const [loading, setLoading] = useState(false);

  // Aplica cores no carregamento inicial
  useEffect(() => {
    aplicarVariaveisCss(empresa);
  }, [empresa]);

  // Carrega configurações do Firestore apenas 1 vez ao iniciar (preserva cota de 50k reads)
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    let isMounted = true;
    const carregarConfiguracoes = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'configuracoes', 'empresa');
        const snap = await getDoc(docRef);

        if (snap.exists() && isMounted) {
          const dadosServidor = snap.data();
          const mesclado = { ...DEFAULT_EMPRESA_CONFIG, ...dadosServidor };
          setEmpresa(mesclado);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mesclado));
          aplicarVariaveisCss(mesclado);
        }
      } catch (err) {
        console.warn('Não foi possível sincronizar configurações da empresa:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    carregarConfiguracoes();
    return () => { isMounted = false; };
  }, []);

  const salvarConfiguracoes = useCallback(async (novosDados) => {
    const atualizado = { ...empresa, ...novosDados };
    
    // Atualiza imediatamente o estado local e localStorage (resposta instantânea)
    setEmpresa(atualizado);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    aplicarVariaveisCss(atualizado);

    // Salva no Firestore
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, 'configuracoes', 'empresa');
      await setDoc(docRef, atualizado, { merge: true });
    }

    return atualizado;
  }, [empresa]);

  const restaurarPadroes = useCallback(async () => {
    return salvarConfiguracoes(DEFAULT_EMPRESA_CONFIG);
  }, [salvarConfiguracoes]);

  return (
    <EmpresaContext.Provider value={{ empresa, loading, salvarConfiguracoes, restaurarPadroes }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa deve ser usado dentro de um EmpresaProvider');
  }
  return context;
}
