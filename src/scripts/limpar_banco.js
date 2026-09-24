import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";

// Credenciais lidas de variáveis de ambiente (configure no seu .env ou ambiente de execução)
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY            || "CONFIGURE_NO_ENV",
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN        || "CONFIGURE_NO_ENV",
  projectId:         process.env.FIREBASE_PROJECT_ID         || "CONFIGURE_NO_ENV",
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET     || "CONFIGURE_NO_ENV",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "CONFIGURE_NO_ENV",
  appId:             process.env.FIREBASE_APP_ID             || "CONFIGURE_NO_ENV",
};

const appDb  = initializeApp(firebaseConfig, "db_temp");
const dbDeposito  = getFirestore(appDb);
const authDeposito = getAuth(appDb);

async function limparColecoes(db, nomeDb) {
  console.log(`\n🧹 Iniciando limpeza do banco: ${nomeDb}...`);
  const colecoes = [
    "produtos", 
    "movimentacoesEstoque", 
    "produto_fornecedor_conversao",
    "compras",
    "vendas",
    "contasReceber",
    "contasPagar",
    "fluxoCaixa"
  ];

  for (const nomeCol of colecoes) {
    try {
      const colRef = collection(db, nomeCol);
      const snapshot = await getDocs(colRef);
      console.log(`Encontrados ${snapshot.size} documentos na coleção '${nomeCol}'`);

      if (snapshot.size === 0) continue;

      const chunks = [];
      const tempDocs = [...snapshot.docs];
      while (tempDocs.length > 0) {
        chunks.push(tempDocs.splice(0, 500));
      }

      let deletados = 0;
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(d => {
          batch.delete(doc(db, nomeCol, d.id));
        });
        await batch.commit();
        deletados += chunk.length;
        console.log(`Deletados ${deletados}/${snapshot.size} de '${nomeCol}'...`);
      }
      console.log(`✅ Coleção '${nomeCol}' limpa com sucesso.`);
    } catch (error) {
      console.error(`❌ Erro ao limpar coleção '${nomeCol}':`, error.message);
    }
  }
}

async function executar() {
  let tempUser = null;
  try {
    console.log("🔑 Efetuando login no banco DEPÓSITO...");
    const userCredential = await signInWithEmailAndPassword(authDeposito, process.env.FIREBASE_ADMIN_EMAIL || "", process.env.FIREBASE_ADMIN_PASSWORD || "");
    tempUser = userCredential.user;
    console.log("✅ Login efetuado com sucesso!");
  } catch (authError) {
    console.log("⚠️ Não foi possível logar. Tentando criar um usuário temporário no DEPÓSITO...");
    try {
      const userCredential = await createUserWithEmailAndPassword(authDeposito, process.env.FIREBASE_TEMP_EMAIL || "temp_admin@app.com", process.env.FIREBASE_TEMP_PASSWORD || "TempAdmin@2026");
      tempUser = userCredential.user;
      console.log("✅ Usuário temporário criado e logado com sucesso!");
    } catch (createError) {
      console.warn("❌ Não foi possível criar usuário temporário:", createError.message);
    }
  }

  await limparColecoes(dbDeposito, "DEPÓSITO");

  if (tempUser && tempUser.email === (process.env.FIREBASE_TEMP_EMAIL || "temp_admin@app.com")) {
    try {
      console.log("🗑️ Deletando usuário temporário no DEPÓSITO...");
      await deleteUser(tempUser);
      console.log("✅ Usuário temporário removido.");
    } catch (deleteError) {
      console.error("❌ Falha ao deletar usuário temporário:", deleteError.message);
    }
  }

  console.log("\n🎉 Limpeza concluída para o banco do Depósito!");
  process.exit(0);
}

executar().catch(err => {
  console.error("Erro geral:", err);
  process.exit(1);
});
