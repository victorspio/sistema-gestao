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
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, timestamp: null });

  const col = (name) => collection(db, name);
  const colDoc = (name, id) => doc(db, name, id);

  const invalidarCache = useCallback(() => {
    cacheRef.current = { data: null, timestamp: null };
  }, []);

  const listarEquipamentos = useCallback(async (searchTerm = '', clienteIdFiltro = null) => {
    try {
      const cache = cacheRef.current;
      if (cache.data && cache.timestamp && Date.now() - cache.timestamp < 120000) {
        let eqData = cache.data;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          eqData = eqData.filter(eq => 
            eq.nome?.toLowerCase().includes(term) ||
            eq.clienteNome?.toLowerCase().includes(term) ||
            eq.numeroSerie?.toLowerCase().includes(term) ||
            eq.marca?.toLowerCase().includes(term) ||
            eq.modelo?.toLowerCase().includes(term) ||
            eq.localInstalacao?.toLowerCase().includes(term)
          );
        }
        if (clienteIdFiltro && clienteIdFiltro !== 'todos') {
          eqData = eqData.filter(eq => eq.clienteId === clienteIdFiltro);
        }
        setEquipamentos(eqData);
        return eqData;
      }

      setLoading(true);
      setError(null);

      const q = query(col('equipamentosInstalados'), orderBy('criadoEm', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      cacheRef.current = { data: lista, timestamp: Date.now() };

      let resultado = lista;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        resultado = resultado.filter(eq => 
          eq.nome?.toLowerCase().includes(term) ||
          eq.clienteNome?.toLowerCase().includes(term) ||
          eq.numeroSerie?.toLowerCase().includes(term) ||
          eq.marca?.toLowerCase().includes(term) ||
          eq.modelo?.toLowerCase().includes(term) ||
          eq.localInstalacao?.toLowerCase().includes(term)
        );
      }
      if (clienteIdFiltro && clienteIdFiltro !== 'todos') {
        resultado = resultado.filter(eq => eq.clienteId === clienteIdFiltro);
      }

      setEquipamentos(resultado);
      return resultado;
    } catch (err) {
      console.error('Erro ao listar equipamentos instalados:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  const adicionarEquipamento = async (dados) => {
    try {
      setLoading(true);
      setError(null);
      const eqRef = doc(col('equipamentosInstalados'));

      const eqData = {
        ...dados,
        nome: dados.nome?.trim() || '',
        clienteId: dados.clienteId || '',
        clienteNome: dados.clienteNome || '',
        tipo: dados.tipo || 'Câmera CFTV',
        marca: dados.marca?.trim() || '',
        modelo: dados.modelo?.trim() || '',
        numeroSerie: dados.numeroSerie?.trim() || '',
        localInstalacao: dados.localInstalacao?.trim() || 'Local principal',
        dataInstalacao: dados.dataInstalacao || new Date().toISOString().split('T')[0],
        dataGarantiaAte: dados.dataGarantiaAte || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: dados.status || 'ativo', // ativo, em_manutencao, substituido, desativado
        historicoManutencao: [],
        observacoes: dados.observacoes?.trim() || '',
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      await setDoc(eqRef, eqData);
      invalidarCache();
      await listarEquipamentos();
      return { id: eqRef.id, ...eqData };
    } catch (err) {
      console.error('Erro ao adicionar equipamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarEquipamento = async (id, dados) => {
    try {
      setLoading(true);
      setError(null);
      const eqRef = colDoc('equipamentosInstalados', id);

      const dadosAtualizados = {
        ...dados,
        atualizadoEm: serverTimestamp()
      };

      await updateDoc(eqRef, dadosAtualizados);
      invalidarCache();
      await listarEquipamentos();
      return { id, ...dadosAtualizados };
    } catch (err) {
      console.error('Erro ao atualizar equipamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registra nova manutenção no histórico do equipamento
  const registrarManutencao = async (id, dadosManutencao) => {
    try {
      setLoading(true);
      const eqRef = colDoc('equipamentosInstalados', id);

      const registro = {
        id: 'manut_' + Date.now(),
        data: dadosManutencao.data || new Date().toISOString().split('T')[0],
        descricao: dadosManutencao.descricao || '',
        tecnico: dadosManutencao.tecnico || '',
        osId: dadosManutencao.osId || '',
        criadoEm: new Date().toISOString()
      };

      await updateDoc(eqRef, {
        historicoManutencao: arrayUnion(registro),
        atualizadoEm: serverTimestamp()
      });

      invalidarCache();
      await listarEquipamentos();
      return registro;
    } catch (err) {
      console.error('Erro ao registrar manutenção:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletarEquipamento = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(colDoc('equipamentosInstalados', id));
      invalidarCache();
      await listarEquipamentos();
      return true;
    } catch (err) {
      console.error('Erro ao excluir equipamento:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    equipamentos,
    loading,
    error,
    listarEquipamentos,
    adicionarEquipamento,
    atualizarEquipamento,
    registrarManutencao,
    deletarEquipamento,
    invalidarCache
  };
}
