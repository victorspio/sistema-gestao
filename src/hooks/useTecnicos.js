import { useState, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function useTecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, timestamp: null });

  const col = (name) => collection(db, name);
  const colDoc = (name, id) => doc(db, name, id);

  const listarTecnicos = useCallback(async () => {
    try {
      if (cacheRef.current.data && Date.now() - cacheRef.current.timestamp < 120000) {
        setTecnicos(cacheRef.current.data);
        return cacheRef.current.data;
      }

      setLoading(true);
      setError(null);

      const q = query(col('tecnicos'), orderBy('nome', 'asc'));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      cacheRef.current = { data: lista, timestamp: Date.now() };
      setTecnicos(lista);
      return lista;
    } catch (err) {
      console.error('Erro ao listar técnicos:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  const adicionarTecnico = async (dados) => {
    try {
      setLoading(true);
      const tecRef = doc(col('tecnicos'));
      const tecData = {
        nome: dados.nome?.trim() || '',
        telefone: dados.telefone?.trim() || '',
        whatsapp: dados.whatsapp?.trim() || '',
        email: dados.email?.trim() || '',
        especialidade: dados.especialidade?.trim() || 'CFTV e Alarmes',
        status: dados.status || 'ativo',
        observacoes: dados.observacoes?.trim() || '',
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      await setDoc(tecRef, tecData);
      cacheRef.current = { data: null, timestamp: null };
      await listarTecnicos();
      return { id: tecRef.id, ...tecData };
    } catch (err) {
      console.error('Erro ao adicionar técnico:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarTecnico = async (id, dados) => {
    try {
      setLoading(true);
      const tecData = {
        nome: dados.nome?.trim() || '',
        telefone: dados.telefone?.trim() || '',
        whatsapp: dados.whatsapp?.trim() || '',
        email: dados.email?.trim() || '',
        especialidade: dados.especialidade?.trim() || 'CFTV e Alarmes',
        status: dados.status || 'ativo',
        observacoes: dados.observacoes?.trim() || '',
        atualizadoEm: serverTimestamp()
      };

      await updateDoc(colDoc('tecnicos', id), tecData);
      cacheRef.current = { data: null, timestamp: null };
      await listarTecnicos();
      return { id, ...tecData };
    } catch (err) {
      console.error('Erro ao atualizar técnico:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletarTecnico = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(colDoc('tecnicos', id));
      cacheRef.current = { data: null, timestamp: null };
      await listarTecnicos();
      return true;
    } catch (err) {
      console.error('Erro ao deletar técnico:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tecnicos,
    loading,
    error,
    listarTecnicos,
    adicionarTecnico,
    atualizarTecnico,
    deletarTecnico
  };
}
