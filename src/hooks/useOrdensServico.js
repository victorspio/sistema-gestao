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
  writeBatch,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function useOrdensServico() {
  const [ordensServico, setOrdensServico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({ data: null, timestamp: null });

  const col = (name) => collection(db, name);
  const colDoc = (name, id) => doc(db, name, id);

  const gerarCodigoOS = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  const invalidarCache = useCallback(() => {
    cacheRef.current = { data: null, timestamp: null };
  }, []);

  const listarOrdensServico = useCallback(async (searchTerm = '', statusFiltro = null) => {
    try {
      const cache = cacheRef.current;
      if (cache.data && cache.timestamp && Date.now() - cache.timestamp < 120000) {
        let osData = cache.data;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          osData = osData.filter(os => 
            os.codigoOS?.includes(term) ||
            os.clienteNome?.toLowerCase().includes(term) ||
            os.tecnicoNome?.toLowerCase().includes(term) ||
            os.descricaoProblema?.toLowerCase().includes(term) ||
            os.tipoServico?.toLowerCase().includes(term)
          );
        }
        if (statusFiltro && statusFiltro !== 'todos') {
          osData = osData.filter(os => os.status === statusFiltro);
        }
        setOrdensServico(osData);
        return osData;
      }

      setLoading(true);
      setError(null);

      const q = query(col('ordensServico'), orderBy('criadoEm', 'desc'), limit(150));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      cacheRef.current = { data: lista, timestamp: Date.now() };

      let resultado = lista;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        resultado = resultado.filter(os => 
          os.codigoOS?.includes(term) ||
          os.clienteNome?.toLowerCase().includes(term) ||
          os.tecnicoNome?.toLowerCase().includes(term) ||
          os.descricaoProblema?.toLowerCase().includes(term) ||
          os.tipoServico?.toLowerCase().includes(term)
        );
      }
      if (statusFiltro && statusFiltro !== 'todos') {
        resultado = resultado.filter(os => os.status === statusFiltro);
      }

      setOrdensServico(resultado);
      return resultado;
    } catch (err) {
      console.error('Erro ao listar OS:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adicionar Ordem de Serviço
  const adicionarOrdemServico = async (dados) => {
    try {
      setLoading(true);
      setError(null);

      const codigoOS = dados.codigoOS || gerarCodigoOS();
      const osRef = doc(col('ordensServico'));

      const valorMateriais = (dados.materiaisUtilizados || []).reduce((acc, m) => {
        return acc + ((parseFloat(m.quantidade) || 0) * (parseFloat(m.valorUnitario) || 0));
      }, 0);
      const valorMaoDeObra = parseFloat(dados.valorMaoDeObra) || 0;
      const valorTotal = Math.round((valorMateriais + valorMaoDeObra) * 100) / 100;

      const osData = {
        ...dados,
        codigoOS,
        valorMateriais: Math.round(valorMateriais * 100) / 100,
        valorMaoDeObra: Math.round(valorMaoDeObra * 100) / 100,
        valorTotal,
        status: dados.status || 'aberta', // aberta, agendada, em_andamento, aguardando_material, concluida, cancelada
        estoqueBaixado: false,
        financeiroLancado: false,
        dataAbertura: dados.dataAbertura || new Date().toISOString().split('T')[0],
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      };

      await setDoc(osRef, osData);
      invalidarCache();
      return { id: osRef.id, ...osData };
    } catch (err) {
      console.error('Erro ao criar OS:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Concluir OS com BAIXA ATÔMICA NO ESTOQUE e LANÇAMENTO NO FINANCEIRO
  const concluirOrdemServico = async (id, dadosConclusao = {}) => {
    try {
      setLoading(true);
      setError(null);

      const osDocSnap = await getDoc(colDoc('ordensServico', id));
      if (!osDocSnap.exists()) {
        throw new Error('Ordem de Serviço não encontrada.');
      }

      const osAtual = osDocSnap.data();
      const materiais = dadosConclusao.materiaisUtilizados || osAtual.materiaisUtilizados || [];
      const batch = writeBatch(db);

      // 1. BAIXA DE ESTOQUE ATÔMICA DOS MATERIAIS UTILIZADOS
      if (!osAtual.estoqueBaixado && materiais.length > 0) {
        // Obter saldos atuais para validação
        const produtoIds = [...new Set(materiais.map(m => m.produtoId).filter(Boolean))];
        const saldosAtuais = {};

        for (const pid of produtoIds) {
          try {
            const snap = await getDoc(colDoc('produtos', pid));
            if (snap.exists()) saldosAtuais[pid] = parseFloat(snap.data().quantidade) || 0;
          } catch { /* produto pode não existir */ }
        }

        // Validação de saldo
        for (const item of materiais) {
          if (!item.produtoId) continue;
          const saldo = saldosAtuais[item.produtoId] ?? 0;
          const qtdUsada = parseFloat(item.quantidade) || 0;
          if (qtdUsada > saldo) {
            throw new Error(`Estoque insuficiente para "${item.nome || 'Equipamento'}". Disponível: ${saldo}, Solicitado na OS: ${qtdUsada}.`);
          }
        }

        // Realiza o decremento e gera movimentação de estoque
        for (const item of materiais) {
          if (!item.produtoId) continue;
          const qtdUsada = parseFloat(item.quantidade) || 0;
          const saldoAntes = saldosAtuais[item.produtoId] ?? 0;
          const saldoDepois = saldoAntes - qtdUsada;

          // Atualiza saldo do produto
          batch.update(colDoc('produtos', item.produtoId), {
            quantidade: increment(-qtdUsada),
            updatedAt: new Date().toISOString()
          });

          // Registra movimentação de saída
          const movRef = doc(col('movimentacoesEstoque'));
          batch.set(movRef, {
            produtoId: item.produtoId,
            produtoNome: item.nome || '',
            tipo: 'saida',
            quantidade: qtdUsada,
            saldoAntes,
            saldoDepois,
            motivo: `Utilização na OS #${osAtual.codigoOS}`,
            osId: id,
            clienteId: osAtual.clienteId || '',
            clienteNome: osAtual.clienteNome || '',
            data: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          // Se for equipamento com serial e marcado para instalar, cadastra em equipamentosInstalados
          if (item.instalarNoCliente) {
            const eqRef = doc(col('equipamentosInstalados'));
            batch.set(eqRef, {
              clienteId: osAtual.clienteId || '',
              clienteNome: osAtual.clienteNome || '',
              produtoId: item.produtoId,
              tipo: item.categoria || 'Equipamento',
              nome: item.nome || '',
              marca: item.marca || '',
              modelo: item.modelo || '',
              numeroSerie: item.numeroSerie || '',
              localInstalacao: dadosConclusao.localInstalacao || osAtual.clienteEndereco || 'Local do cliente',
              dataInstalacao: new Date().toISOString().split('T')[0],
              dataGarantiaAte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'ativo',
              osId: id,
              codigoOS: osAtual.codigoOS,
              criadoEm: serverTimestamp()
            });
          }
        }
      }

      // 2. LANÇAMENTO NO FINANCEIRO (Contas a Receber)
      const valorTotal = dadosConclusao.valorTotal !== undefined 
        ? parseFloat(dadosConclusao.valorTotal) 
        : parseFloat(osAtual.valorTotal) || 0;

      if (!osAtual.financeiroLancado && valorTotal > 0) {
        const contaRef = doc(col('contasReceber'));
        const hoje = new Date();
        batch.set(contaRef, {
          origem: 'os',
          osId: id,
          codigoOS: osAtual.codigoOS,
          clienteId: osAtual.clienteId || '',
          clienteNome: osAtual.clienteNome || '',
          descricao: `Serviço e Materiais - OS #${osAtual.codigoOS}`,
          valor: valorTotal,
          valorRecebido: 0,
          dataVencimento: dadosConclusao.dataVencimento ? new Date(dadosConclusao.dataVencimento) : hoje,
          status: dadosConclusao.formaPagamento && dadosConclusao.pagoAgora ? 'pago' : 'pendente',
          dataPagamento: dadosConclusao.pagoAgora ? hoje : null,
          formaPagamento: dadosConclusao.formaPagamento || 'pix',
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp()
        });
      }

      // 3. ATUALIZA A OS
      const osRef = colDoc('ordensServico', id);
      batch.update(osRef, {
        ...dadosConclusao,
        status: 'concluida',
        estoqueBaixado: true,
        financeiroLancado: valorTotal > 0,
        dataConclusao: new Date().toISOString(),
        atualizadoEm: serverTimestamp()
      });

      await batch.commit();
      invalidarCache();
      return true;
    } catch (err) {
      console.error('Erro ao concluir OS:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar OS
  const atualizarOrdemServico = async (id, dados) => {
    try {
      setLoading(true);
      setError(null);

      const valorMateriais = (dados.materiaisUtilizados || []).reduce((acc, m) => {
        return acc + ((parseFloat(m.quantidade) || 0) * (parseFloat(m.valorUnitario) || 0));
      }, 0);
      const valorMaoDeObra = parseFloat(dados.valorMaoDeObra) || 0;
      const valorTotal = Math.round((valorMateriais + valorMaoDeObra) * 100) / 100;

      const dadosAtualizados = {
        ...dados,
        valorMateriais: Math.round(valorMateriais * 100) / 100,
        valorMaoDeObra: Math.round(valorMaoDeObra * 100) / 100,
        valorTotal,
        atualizadoEm: serverTimestamp()
      };

      await updateDoc(colDoc('ordensServico', id), dadosAtualizados);
      invalidarCache();
      return { id, ...dadosAtualizados };
    } catch (err) {
      console.error('Erro ao atualizar OS:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar OS
  const deletarOrdemServico = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(colDoc('ordensServico', id));
      invalidarCache();
      return true;
    } catch (err) {
      console.error('Erro ao deletar OS:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    ordensServico,
    loading,
    error,
    listarOrdensServico,
    adicionarOrdemServico,
    concluirOrdemServico,
    atualizarOrdemServico,
    deletarOrdemServico,
    invalidarCache
  };
}
