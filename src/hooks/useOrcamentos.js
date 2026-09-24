import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, timestamp: null });

  const col = (name) => collection(db, name);
  const colDoc = (name, id) => doc(db, name, id);

  const gerarCodigoOrcamento = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const invalidarCache = useCallback(() => {
    cacheRef.current = { data: null, timestamp: null };
  }, []);

  // Lista todos os orçamentos com filtros opcionais
  const listarOrcamentos = useCallback(async (searchTerm = '', statusFiltro = null) => {
    try {
      const cache = cacheRef.current;
      if (cache.data && cache.timestamp && Date.now() - cache.timestamp < 120000) {
        let orcData = cache.data;
        if (searchTerm) {
          const termLower = searchTerm.toLowerCase();
          orcData = orcData.filter(o => 
            o.codigoOrcamento?.includes(termLower) ||
            o.clienteNome?.toLowerCase().includes(termLower) ||
            o.clienteCpf?.includes(termLower) ||
            o.observacoes?.toLowerCase().includes(termLower)
          );
        }
        if (statusFiltro && statusFiltro !== 'todos') {
          orcData = orcData.filter(o => o.status === statusFiltro);
        }
        setOrcamentos(orcData);
        return orcData;
      }

      setLoading(true);
      setError(null);

      let q = query(col('orcamentos'), orderBy('criadoEm', 'desc'), limit(150));
      const snapshot = await getDocs(q);
      const orcamentosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      cacheRef.current = { data: orcamentosData, timestamp: Date.now() };

      let resultado = orcamentosData;
      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        resultado = resultado.filter(o => 
          o.codigoOrcamento?.includes(termLower) ||
          o.clienteNome?.toLowerCase().includes(termLower) ||
          o.clienteCpf?.includes(termLower) ||
          o.observacoes?.toLowerCase().includes(termLower)
        );
      }
      if (statusFiltro && statusFiltro !== 'todos') {
        resultado = resultado.filter(o => o.status === statusFiltro);
      }

      setOrcamentos(resultado);
      return resultado;
    } catch (err) {
      console.error('Erro ao listar orçamentos:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adiciona novo orçamento
  const adicionarOrcamento = async (dados) => {
    try {
      setLoading(true);
      setError(null);
      const codigoOrcamento = dados.codigoOrcamento || gerarCodigoOrcamento();
      const orcRef = doc(col('orcamentos'));

      const subtotalProdutos = (dados.produtos || []).reduce((acc, item) => {
        return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
      }, 0);

      const subtotalServicos = (dados.servicos || []).reduce((acc, item) => {
        return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
      }, 0);

      const desconto = parseFloat(dados.desconto) || 0;
      const valorTotal = Math.max(0, subtotalProdutos + subtotalServicos - desconto);

      const orcamentoData = {
        ...dados,
        codigoOrcamento,
        subtotalProdutos: Math.round(subtotalProdutos * 100) / 100,
        subtotalServicos: Math.round(subtotalServicos * 100) / 100,
        desconto: Math.round(desconto * 100) / 100,
        valorTotal: Math.round(valorTotal * 100) / 100,
        status: dados.status || 'aguardando', // rascunho, enviado, aguardando, aprovado, recusado, cancelado
        validadeDias: parseInt(dados.validadeDias) || 15,
        prazoExecucao: dados.prazoExecucao || '3 a 5 dias úteis',
        condicoesPagamento: dados.condicoesPagamento || '50% de entrada e restante na conclusão',
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      await setDoc(orcRef, orcamentoData);
      invalidarCache();
      return { id: orcRef.id, ...orcamentoData };
    } catch (err) {
      console.error('Erro ao adicionar orçamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualiza um orçamento existente
  const atualizarOrcamento = async (id, dados) => {
    try {
      setLoading(true);
      setError(null);

      const subtotalProdutos = (dados.produtos || []).reduce((acc, item) => {
        return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
      }, 0);

      const subtotalServicos = (dados.servicos || []).reduce((acc, item) => {
        return acc + ((parseFloat(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0));
      }, 0);

      const desconto = parseFloat(dados.desconto) || 0;
      const valorTotal = Math.max(0, subtotalProdutos + subtotalServicos - desconto);

      const dadosAtualizados = {
        ...dados,
        subtotalProdutos: Math.round(subtotalProdutos * 100) / 100,
        subtotalServicos: Math.round(subtotalServicos * 100) / 100,
        desconto: Math.round(desconto * 100) / 100,
        valorTotal: Math.round(valorTotal * 100) / 100,
        atualizadoEm: serverTimestamp()
      };

      await updateDoc(colDoc('orcamentos', id), dadosAtualizados);
      invalidarCache();
      return { id, ...dadosAtualizados };
    } catch (err) {
      console.error('Erro ao atualizar orçamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Altera status do orçamento (ex: 'aprovado', 'recusado')
  const alterarStatusOrcamento = async (id, novoStatus) => {
    try {
      setLoading(true);
      await updateDoc(colDoc('orcamentos', id), {
        status: novoStatus,
        atualizadoEm: serverTimestamp()
      });
      invalidarCache();
      return true;
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deleta um orçamento
  const deletarOrcamento = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(colDoc('orcamentos', id));
      invalidarCache();
      return true;
    } catch (err) {
      console.error('Erro ao deletar orçamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    orcamentos,
    loading,
    error,
    listarOrcamentos,
    adicionarOrcamento,
    atualizarOrcamento,
    alterarStatusOrcamento,
    deletarOrcamento,
    invalidarCache
  };
}
